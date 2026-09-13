// Internal functions are only callable with deployment credentials, never from the game.
import { v } from "convex/values";
import { internalMutation } from "./functions";
import { avatarColors } from "../src/content/town";
export const createWorld = internalMutation({
  args: { name: v.string(), ownerSubject: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name || !args.ownerSubject.startsWith("user_"))
      throw new Error("Supply a world name and Clerk user ID.");
    const worldId = await ctx.db.insert("worlds", { name: name.slice(0, 60) });
    await ctx.db.insert("memberships", {
      worldId,
      subject: args.ownerSubject,
      role: "owner",
    });
    await ctx.db.insert("characters", {
      worldId,
      subject: args.ownerSubject,
      name: "Neighbor 1",
      color: avatarColors[0],
      balance: 50,
      inventory: {},
      delivery: "none",
      deliveries: 0,
    });
    return worldId;
  },
});
export const addMember = internalMutation({
  args: { worldId: v.id("worlds"), subject: v.string() },
  handler: async (ctx, args) => {
    if (!(await ctx.db.get(args.worldId)) || !args.subject.startsWith("user_"))
      throw new Error("Supply an existing world and Clerk user ID.");
    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_world_subject", (q) =>
        q.eq("worldId", args.worldId).eq("subject", args.subject),
      )
      .unique();
    if (existing) return;
    const members = await ctx.db
      .query("characters")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .collect();
    await ctx.db.insert("memberships", { ...args, role: "player" });
    await ctx.db.insert("characters", {
      worldId: args.worldId,
      subject: args.subject,
      name: `Neighbor ${members.length + 1}`,
      color: avatarColors[members.length % avatarColors.length],
      balance: 50,
      inventory: {},
      delivery: "none",
      deliveries: 0,
    });
  },
});
