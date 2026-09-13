import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { query, mutation, type QueryCtx, type MutationCtx } from "./functions";
import { avatarColors, shopItems, stops, town } from "../src/content/town";
async function member(
  ctx: QueryCtx | MutationCtx,
  worldId: GenericId<"worlds">,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Please sign in.");
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_world_subject", (q) =>
      q.eq("worldId", worldId).eq("subject", identity.subject),
    )
    .unique();
  if (!membership)
    throw new Error("This world is private. Ask its owner to add you.");
  const character = await ctx.db
    .query("characters")
    .withIndex("by_world_subject", (q) =>
      q.eq("worldId", worldId).eq("subject", identity.subject),
    )
    .unique();
  if (!character) throw new Error("Your character has not been set up yet.");
  return character;
}
async function position(
  ctx: QueryCtx | MutationCtx,
  characterId: GenericId<"characters">,
) {
  return ctx.db
    .query("presence")
    .withIndex("by_character", (q) => q.eq("characterId", characterId))
    .unique();
}
export const worlds = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .collect();
    return Promise.all(
      memberships.map(async (m) => ({
        id: m.worldId,
        name: (await ctx.db.get(m.worldId))!.name,
      })),
    );
  },
});
export const snapshot = query({
  args: { worldId: v.id("worlds") },
  handler: async (ctx, { worldId }) => {
    const c = await member(ctx, worldId);
    const homes = await ctx.db
      .query("characters")
      .withIndex("by_world", (q) => q.eq("worldId", worldId))
      .collect();
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_character", (q) => q.eq("characterId", c._id))
      .order("desc")
      .take(20);
    // Movement lives in a separate subscription to avoid refreshing inventories on each step.
    return {
      worldId,
      worldName: (await ctx.db.get(worldId))!.name,
      character: {
        id: c._id,
        name: c.name,
        color: c.color,
        balance: c.balance,
        inventory: c.inventory,
        delivery: c.delivery,
        deliveries: c.deliveries,
      },
      homes: homes.map((h) => ({ id: h._id, name: h.name, color: h.color })),
      receipts: receipts.map((r) => ({
        id: r._id,
        label: r.label,
        amount: r.amount,
        at: r.at,
      })),
    };
  },
});
export const people = query({
  args: { worldId: v.id("worlds"), room: v.string() },
  handler: async (ctx, { worldId, room }) => {
    await member(ctx, worldId);
    const positions = await ctx.db
      .query("presence")
      .withIndex("by_world_room", (q) =>
        q.eq("worldId", worldId).eq("room", room),
      )
      .collect();
    return Promise.all(
      positions.map(async (p) => {
        const c = (await ctx.db.get(p.characterId))!;
        return {
          id: c._id,
          name: c.name,
          color: c.color,
          room: p.room,
          x: p.x,
          y: p.y,
          updatedAt: p.updatedAt,
          emote: p.emote,
          emoteAt: p.emoteAt,
        };
      }),
    );
  },
});
export const move = mutation({
  args: { worldId: v.id("worlds"), x: v.number(), y: v.number() },
  handler: async (ctx, args) => {
    const c = await member(ctx, args.worldId);
    if (!Number.isFinite(args.x) || !Number.isFinite(args.y))
      throw new Error("Invalid position.");
    const p = await position(ctx, c._id);
    const value = {
      worldId: args.worldId,
      characterId: c._id,
      room: p?.room ?? "town",
      x: Math.max(30, Math.min(town.width - 30, args.x)),
      y: Math.max(30, Math.min(town.height - 30, args.y)),
      updatedAt: Date.now(),
    };
    if (p) await ctx.db.patch(p._id, value);
    else await ctx.db.insert("presence", value);
  },
});
export const enter = mutation({
  args: { worldId: v.id("worlds"), room: v.string() },
  handler: async (ctx, { worldId, room }) => {
    const c = await member(ctx, worldId);
    if (room !== "town") {
      const homes = await ctx.db
        .query("characters")
        .withIndex("by_world", (q) => q.eq("worldId", worldId))
        .collect();
      if (!homes.some((h) => `home:${h._id}` === room))
        throw new Error("That home is not in this world.");
    }
    const p = await position(ctx, c._id);
    const value = {
      worldId,
      characterId: c._id,
      room,
      ...town.spawn,
      updatedAt: Date.now(),
    };
    if (p) await ctx.db.patch(p._id, value);
    else await ctx.db.insert("presence", value);
  },
});
export const emote = mutation({
  args: { worldId: v.id("worlds"), value: v.string() },
  handler: async (ctx, { worldId, value }) => {
    const c = await member(ctx, worldId);
    if (!["👋", "❤️", "✨", "😊"].includes(value))
      throw new Error("Choose an emote.");
    const p = await position(ctx, c._id);
    if (p)
      await ctx.db.patch(p._id, {
        emote: value,
        emoteAt: Date.now(),
        updatedAt: Date.now(),
      });
  },
});
export const profile = mutation({
  args: { worldId: v.id("worlds"), name: v.string(), color: v.string() },
  handler: async (ctx, args) => {
    const c = await member(ctx, args.worldId);
    const name = args.name.trim();
    if (
      name.length < 1 ||
      name.length > 24 ||
      !avatarColors.includes(args.color)
    )
      throw new Error("Choose a name (1–24 letters) and an avatar color.");
    await ctx.db.patch(c._id, { name, color: args.color });
  },
});
export const transact = mutation({
  args: {
    worldId: v.id("worlds"),
    type: v.union(
      v.literal("buy"),
      v.literal("use"),
      v.literal("startJob"),
      v.literal("finishJob"),
    ),
    itemId: v.optional(v.string()),
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    const c = await member(ctx, args.worldId);
    if (!args.requestId || args.requestId.length > 100)
      throw new Error("Invalid request.");
    if (
      await ctx.db
        .query("receipts")
        .withIndex("by_character_request", (q) =>
          q.eq("characterId", c._id).eq("requestId", args.requestId),
        )
        .unique()
    )
      return;
    const p = await position(ctx, c._id);
    function near(stopId: string) {
      const stop = stops.find((s) => s.id === stopId)!;
      if (
        !p ||
        p.room !== "town" ||
        Math.hypot(p.x - stop.x, p.y - stop.y) > 160
      )
        throw new Error(`Walk to ${stop.name} first.`);
    }
    let label = "",
      amount = 0;
    if (args.type === "startJob") {
      near("post");
      if (c.delivery !== "none")
        throw new Error("You already have a delivery.");
      await ctx.db.patch(c._id, { delivery: "carrying" });
      label = "Picked up a café parcel";
    } else if (args.type === "finishJob") {
      near("cafe");
      if (c.delivery !== "carrying")
        throw new Error("Pick up a parcel at Little Post first.");
      amount = 15;
      label = "Café delivery";
      await ctx.db.patch(c._id, {
        delivery: "none",
        balance: c.balance + amount,
        deliveries: c.deliveries + 1,
      });
    } else {
      const item = shopItems.find((d) => d.id === args.itemId);
      if (!item) throw new Error("That item is not available.");
      const inventory = { ...c.inventory };
      if (args.type === "buy") {
        near(item.shop);
        if (c.balance < item.price)
          throw new Error("You need a few more coins. Try a delivery!");
        amount = -item.price;
        label = item.name;
        inventory[item.id] = (inventory[item.id] ?? 0) + 1;
      } else {
        if (!(inventory[item.id] > 0))
          throw new Error("There are none left in your bag.");
        inventory[item.id] -= 1;
        label = `Enjoyed ${item.name}`;
      }
      await ctx.db.patch(c._id, { inventory, balance: c.balance + amount });
    }
    await ctx.db.insert("receipts", {
      worldId: args.worldId,
      characterId: c._id,
      requestId: args.requestId,
      label,
      amount,
      at: Date.now(),
    });
  },
});
