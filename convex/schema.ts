import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  worlds: defineTable({ name: v.string() }),
  memberships: defineTable({
    worldId: v.id("worlds"),
    subject: v.string(),
    role: v.union(v.literal("owner"), v.literal("player")),
  })
    .index("by_subject", ["subject"])
    .index("by_world_subject", ["worldId", "subject"]),
  characters: defineTable({
    worldId: v.id("worlds"),
    subject: v.string(),
    name: v.string(),
    color: v.string(),
    balance: v.number(),
    inventory: v.record(v.string(), v.number()),
    delivery: v.union(v.literal("none"), v.literal("carrying")),
    deliveries: v.number(),
  })
    .index("by_world_subject", ["worldId", "subject"])
    .index("by_world", ["worldId"]),
  presence: defineTable({
    worldId: v.id("worlds"),
    characterId: v.id("characters"),
    room: v.string(),
    x: v.number(),
    y: v.number(),
    updatedAt: v.number(),
    emote: v.optional(v.string()),
    emoteAt: v.optional(v.number()),
  })
    .index("by_character", ["characterId"])
    .index("by_world_room", ["worldId", "room"]),
  receipts: defineTable({
    worldId: v.id("worlds"),
    characterId: v.id("characters"),
    requestId: v.string(),
    label: v.string(),
    amount: v.number(),
    at: v.number(),
  })
    .index("by_character", ["characterId"])
    .index("by_character_request", ["characterId", "requestId"]),
});
