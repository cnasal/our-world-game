import { petFor } from "../src/content/pets";
import { shopFor } from "../src/content/interiors";
import { atDelivery, deliveryPlaces } from "../src/content/deliveries";
import { hotel, hotelMeals, isHotelRoom } from "../src/content/hotel";
import { furnitureFor } from "../src/content/furniture";
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
        petId: c.petId,
        delivery: c.delivery,
        deliveryTarget: c.deliveryTarget,
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
          petId: c.petId,
          room: p.room,
          x: p.x,
          y: p.y,
          updatedAt: p.updatedAt,
          restId: p.restId,
          emote: p.emote,
          emoteAt: p.emoteAt,
        };
      }),
    );
  },
});
export const move = mutation({
  args: {
    worldId: v.id("worlds"),
    x: v.number(),
    y: v.number(),
    restId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const c = await member(ctx, args.worldId);
    if (!Number.isFinite(args.x) || !Number.isFinite(args.y))
      throw new Error("Invalid position.");
    const p = await position(ctx, c._id);
    // A delayed movement message must not undo a sit/stand transition.
    if (args.restId !== undefined && (args.restId ?? undefined) !== p?.restId)
      return;
    if (p?.restId) {
      await ctx.db.patch(p._id, { updatedAt: Date.now() });
      return;
    }
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
    if (
      room !== "town" &&
      room !== "school" &&
      !isHotelRoom(room) &&
      !shopFor(room)
    ) {
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
      restId: undefined,
      ...town.spawn,
      updatedAt: Date.now(),
    };
    if (p) await ctx.db.patch(p._id, value);
    else await ctx.db.insert("presence", value);
  },
});
export const rest = mutation({
  args: { worldId: v.id("worlds"), furnitureId: v.union(v.string(), v.null()) },
  handler: async (ctx, { worldId, furnitureId }) => {
    const c = await member(ctx, worldId);
    const p = await position(ctx, c._id);
    if (!p) throw new Error("Enter the town first.");
    const furniture = furnitureFor(p.room);
    if (furnitureId === null) {
      const previous = furniture.find((item) => item.id === p.restId);
      const spot = previous?.approach ?? { x: p.x, y: p.y };
      await ctx.db.patch(p._id, {
        ...spot,
        restId: undefined,
        updatedAt: Date.now(),
      });
      return { ...spot, restId: undefined };
    }
    const seat = furniture.find((item) => item.id === furnitureId);
    if (!seat) throw new Error("That furniture is not in this room.");
    if (p.restId === furnitureId) return { x: p.x, y: p.y, restId: p.restId };
    if (p.restId) throw new Error("Stand up first.");
    if (Math.hypot(p.x - seat.approach.x, p.y - seat.approach.y) > 95)
      throw new Error(`Walk to the ${seat.name.toLowerCase()} first.`);
    const people = await ctx.db
      .query("presence")
      .withIndex("by_world_room", (q) =>
        q.eq("worldId", worldId).eq("room", p.room),
      )
      .collect();
    if (
      people.some(
        (other) =>
          other.characterId !== c._id &&
          other.restId === furnitureId &&
          Date.now() - other.updatedAt < 45000,
      )
    )
      throw new Error("Someone is resting there. Try another spot.");
    // Reclaim abandoned seats without letting a returning heartbeat occupy them twice.
    for (const other of people.filter(
      (entry) => entry.characterId !== c._id && entry.restId === furnitureId,
    )) {
      await ctx.db.patch(other._id, { ...seat.approach, restId: undefined });
    }
    const value = { x: seat.x, y: seat.y, restId: seat.id };
    await ctx.db.patch(p._id, { ...value, updatedAt: Date.now() });
    return value;
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
      v.literal("adopt"),
      v.literal("eatFree"),
      v.literal("buy"),
      v.literal("use"),
      v.literal("startJob"),
      v.literal("finishJob"),
    ),
    itemId: v.optional(v.string()),
    destination: v.optional(v.string()),
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
      if (p?.room === `shop:${stopId}` && shopFor(p.room)) return;
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
    if (args.type === "adopt") {
      if (p?.room !== "shop:shelter")
        throw new Error("Come inside the animal shelter to choose a pet.");
      if (c.petId)
        throw new Error("You already have a pet. One friend at a time!");
      const pet = petFor(args.itemId);
      if (!pet) throw new Error("Choose a pet from the shelter.");
      if (c.balance < pet.price)
        throw new Error("You need a few more coins. Try a delivery!");
      amount = -pet.price;
      label = `Adopted ${pet.name}`;
      await ctx.db.patch(c._id, { petId: pet.id, balance: c.balance + amount });
    } else if (args.type === "startJob") {
      near("post");
      if (c.delivery !== "none")
        throw new Error("You already have a delivery.");
      const homes = await ctx.db
        .query("characters")
        .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
        .collect();
      const destination = deliveryPlaces(
        homes.map((home) => ({ id: home._id, name: home.name })),
      ).find((place) => place.id === (args.destination ?? "cafe"));
      if (!destination)
        throw new Error("Choose a delivery place in this town.");
      await ctx.db.patch(c._id, {
        delivery: "carrying",
        deliveryTarget: destination.id,
      });
      label = `Picked up a parcel for ${destination.name}`;
    } else if (args.type === "finishJob") {
      if (c.delivery !== "carrying")
        throw new Error("Pick up a parcel at Little Post first.");
      const homes = await ctx.db
        .query("characters")
        .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
        .collect();
      const destination = deliveryPlaces(
        homes.map((home) => ({ id: home._id, name: home.name })),
      ).find((place) => place.id === (c.deliveryTarget ?? "cafe"));
      if (!destination || !p || !atDelivery(destination, p))
        throw new Error(
          `Bring your parcel to ${destination?.name ?? "its destination"} first.`,
        );
      amount = 15;
      label = `Delivery to ${destination.name}`;
      await ctx.db.patch(c._id, {
        delivery: "none",
        deliveryTarget: undefined,
        balance: c.balance + amount,
        deliveries: c.deliveries + 1,
      });
    } else if (args.type === "eatFree") {
      if (p?.room !== hotel.dining)
        throw new Error("Visit the hotel dining room for a free meal.");
      const meal = hotelMeals.find((item) => item.id === args.itemId);
      if (!meal) throw new Error("Choose a meal from the hotel menu.");
      label = `Enjoyed ${meal.name} at the hotel`;
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
        if (item.shop !== "toys") inventory[item.id] -= 1;
        label =
          item.shop === "toys"
            ? `Played with ${item.name}`
            : `Enjoyed ${item.name}`;
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
