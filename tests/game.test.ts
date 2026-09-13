import { guestRooms, hotel, hotelMeals } from "../src/content/hotel";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
async function setup() {
  const t = convexTest(schema, modules);
  const worldId = await t.mutation(internal.admin.createWorld, {
    name: "Test town",
    ownerSubject: "user_owner",
  });
  const owner = t.withIdentity({ subject: "user_owner" });
  await owner.mutation(api.game.enter, { worldId, room: "town" });
  return { t, worldId, owner };
}
describe("private shared town", () => {
  test("ten connected characters share positions and emotes without sharing wallets", async () => {
    const { t, worldId, owner } = await setup();
    for (let i = 2; i <= 10; i++) {
      await t.mutation(internal.admin.addMember, {
        worldId,
        subject: `user_${i}`,
      });
      const player = t.withIdentity({ subject: `user_${i}` });
      await player.mutation(api.game.enter, { worldId, room: "town" });
      await player.mutation(api.game.move, { worldId, x: 332, y: 465 });
    }
    expect(
      await owner.query(api.game.people, { worldId, room: "town" }),
    ).toHaveLength(10);
    const second = t.withIdentity({ subject: "user_2" });
    await second.mutation(api.game.emote, { worldId, value: "👋" });
    await second.mutation(api.game.transact, {
      worldId,
      type: "buy",
      itemId: "berry-milk",
      requestId: "second-buy",
    });
    const secondState = await second.query(api.game.snapshot, { worldId });
    expect(secondState.character.balance).toBe(42);
    expect(
      (await owner.query(api.game.snapshot, { worldId })).character.balance,
    ).toBe(50);
    expect(
      (await owner.query(api.game.people, { worldId, room: "town" })).find(
        (p) => p.id === secondState.character.id,
      )?.emote,
    ).toBe("👋");
    await second.mutation(api.game.enter, {
      worldId,
      room: `home:${secondState.character.id}`,
    });
    expect(
      await owner.query(api.game.people, { worldId, room: "town" }),
    ).toHaveLength(9);
  });

  test("anonymous users and signed-in outsiders cannot read or change a private world", async () => {
    const { t, worldId } = await setup();
    for (const client of [t, t.withIdentity({ subject: "user_stranger" })]) {
      await expect(
        client.query(api.game.snapshot, { worldId }),
      ).rejects.toThrow();
      await expect(
        client.query(api.game.people, { worldId, room: "town" }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.game.move, { worldId, x: 30, y: 40 }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.game.profile, {
          worldId,
          name: "Stolen",
          color: "#db856f",
        }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.game.transact, {
          worldId,
          type: "finishJob",
          requestId: "bad",
        }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.game.enter, { worldId, room: "town" }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.game.emote, { worldId, value: "👋" }),
      ).rejects.toThrow();
    }
  });
  test("ten members get their own homes and progress; membership stays scoped to each world", async () => {
    const { t, worldId, owner } = await setup();
    for (let i = 2; i <= 10; i++)
      await t.mutation(internal.admin.addMember, {
        worldId,
        subject: `user_${i}`,
      });
    await t.mutation(internal.admin.addMember, { worldId, subject: "user_10" });
    const otherWorld = await t.mutation(internal.admin.createWorld, {
      name: "Other town",
      ownerSubject: "user_other",
    });
    expect(
      (await owner.query(api.game.snapshot, { worldId })).homes,
    ).toHaveLength(10);
    expect(await owner.query(api.game.worlds, {})).toHaveLength(1);
    await expect(
      owner.query(api.game.snapshot, { worldId: otherWorld }),
    ).rejects.toThrow();
    const other = await t
      .withIdentity({ subject: "user_other" })
      .query(api.game.snapshot, { worldId: otherWorld });
    await expect(
      owner.mutation(api.game.enter, {
        worldId,
        room: `home:${other.character.id}`,
      }),
    ).rejects.toThrow();
  });
  test("purchases charge and grant once, survive duplicate requests, and cannot overdraw", async () => {
    const { owner, worldId } = await setup();
    await owner.mutation(api.game.move, { worldId, x: 332, y: 465 });
    const buy = {
      worldId,
      type: "buy" as const,
      itemId: "rainbow-cocoa",
      requestId: "one",
    };
    await owner.mutation(api.game.transact, buy);
    await owner.mutation(api.game.transact, buy);
    let s = await owner.query(api.game.snapshot, { worldId });
    expect(s.character.balance).toBe(38);
    expect(s.character.inventory["rainbow-cocoa"]).toBe(1);
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) =>
        owner.mutation(api.game.transact, {
          ...buy,
          requestId: `parallel-${i}`,
        }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    s = await owner.query(api.game.snapshot, { worldId });
    expect(s.character.balance).toBe(2);
    expect(s.character.inventory["rainbow-cocoa"]).toBe(4);
  });
  test("jobs need a pickup and arrival, rewards cannot be collected twice, and consumables are finite", async () => {
    const { worldId, owner } = await setup();
    await expect(
      owner.mutation(api.game.transact, {
        worldId,
        type: "buy",
        itemId: "berry-milk",
        requestId: "too-far",
      }),
    ).rejects.toThrow();
    await owner.mutation(api.game.move, { worldId, x: 1110, y: 465 });
    await owner.mutation(api.game.transact, {
      worldId,
      type: "startJob",
      requestId: "pickup",
    });
    await expect(
      owner.mutation(api.game.transact, {
        worldId,
        type: "finishJob",
        requestId: "early",
      }),
    ).rejects.toThrow();
    await owner.mutation(api.game.move, { worldId, x: 332, y: 465 });
    await owner.mutation(api.game.transact, {
      worldId,
      type: "finishJob",
      requestId: "delivered",
    });
    await owner.mutation(api.game.transact, {
      worldId,
      type: "finishJob",
      requestId: "delivered",
    });
    await expect(
      owner.mutation(api.game.transact, {
        worldId,
        type: "finishJob",
        requestId: "again",
      }),
    ).rejects.toThrow();
    await owner.mutation(api.game.transact, {
      worldId,
      type: "buy",
      itemId: "berry-milk",
      requestId: "buy",
    });
    await owner.mutation(api.game.transact, {
      worldId,
      type: "use",
      itemId: "berry-milk",
      requestId: "sip",
    });
    await expect(
      owner.mutation(api.game.transact, {
        worldId,
        type: "use",
        itemId: "berry-milk",
        requestId: "sip-again",
      }),
    ).rejects.toThrow();
    const s = await owner.query(api.game.snapshot, { worldId });
    expect(s.character.balance).toBe(57);
    expect(s.character.deliveries).toBe(1);
    expect(s.character.inventory["berry-milk"]).toBe(0);
  });
  test("restaurant meals require arrival, charge once, and can only be eaten once", async () => {
    const { owner, worldId } = await setup();
    const buy = {
      worldId,
      type: "buy" as const,
      itemId: "sunny-pizza",
      requestId: "meal",
    };
    await owner.mutation(api.game.move, { worldId, x: 332, y: 465 });
    await expect(owner.mutation(api.game.transact, buy)).rejects.toThrow(
      "Walk to The Nasal Restaurant first.",
    );
    await owner.mutation(api.game.move, { worldId, x: 705, y: 405 });
    await expect(
      owner.mutation(api.game.transact, {
        ...buy,
        itemId: "berry-milk",
        requestId: "wrong-shop",
      }),
    ).rejects.toThrow("Walk to Cloud Café first.");
    await owner.mutation(api.game.transact, buy);
    await owner.mutation(api.game.transact, buy);
    let saved = await owner.query(api.game.snapshot, { worldId });
    expect(saved.character.balance).toBe(40);
    expect(saved.character.inventory["sunny-pizza"]).toBe(1);
    const eat = { ...buy, type: "use" as const, requestId: "eat" };
    await owner.mutation(api.game.transact, eat);
    await owner.mutation(api.game.transact, eat);
    await expect(
      owner.mutation(api.game.transact, { ...eat, requestId: "eat-again" }),
    ).rejects.toThrow();
    saved = await owner.query(api.game.snapshot, { worldId });
    expect(saved.character.balance).toBe(40);
    expect(saved.character.inventory["sunny-pizza"]).toBe(0);
  });
  test("members share the school room and outsiders cannot enter it", async () => {
    const { owner, worldId, t } = await setup();
    await t.mutation(internal.admin.addMember, {
      worldId,
      subject: "user_classmate",
    });
    const classmate = t.withIdentity({ subject: "user_classmate" });
    for (const player of [owner, classmate]) {
      await player.mutation(api.game.enter, { worldId, room: "school" });
    }
    await owner.mutation(api.game.move, { worldId, x: 480, y: 530 });
    const people = await classmate.query(api.game.people, {
      worldId,
      room: "school",
    });
    expect(people).toHaveLength(2);
    expect(people.some((person) => person.x === 480 && person.y === 530)).toBe(
      true,
    );
    await expect(
      t
        .withIdentity({ subject: "user_outsider" })
        .mutation(api.game.enter, { worldId, room: "school" }),
    ).rejects.toThrow();
    await expect(
      owner.mutation(api.game.enter, { worldId, room: "made-up-room" }),
    ).rejects.toThrow();
    await owner.mutation(api.game.enter, { worldId, room: "town" });
    expect(
      await classmate.query(api.game.people, { worldId, room: "school" }),
    ).toHaveLength(1);
    expect(
      (await owner.query(api.game.snapshot, { worldId })).character.balance,
    ).toBe(50);
  });
  test("resting validates furniture and distance, shares poses, and returns to a safe spot", async () => {
    const { owner, worldId, t } = await setup();
    const before = await owner.query(api.game.snapshot, { worldId });
    await expect(
      owner.mutation(api.game.rest, { worldId, furnitureId: "bed" }),
    ).rejects.toThrow("not in this room");
    const room = `home:${before.character.id}`;
    await owner.mutation(api.game.enter, { worldId, room });
    await expect(
      owner.mutation(api.game.rest, { worldId, furnitureId: "bed" }),
    ).rejects.toThrow("Walk to");
    await owner.mutation(api.game.move, { worldId, x: 865, y: 530 });
    await owner.mutation(api.game.rest, { worldId, furnitureId: "bed" });
    await owner.mutation(api.game.rest, { worldId, furnitureId: "bed" });
    await owner.mutation(api.game.move, { worldId, x: 720, y: 665 });
    let people = await owner.query(api.game.people, { worldId, room });
    expect(people[0]).toMatchObject({ restId: "bed", x: 981, y: 490 });
    await owner.mutation(api.game.rest, { worldId, furnitureId: null });
    await owner.mutation(api.game.rest, { worldId, furnitureId: null });
    people = await owner.query(api.game.people, { worldId, room });
    expect(people[0]).toMatchObject({ x: 865, y: 530 });
    expect(people[0].restId).toBeUndefined();
    await owner.mutation(api.game.rest, { worldId, furnitureId: "bed" });
    await owner.mutation(api.game.enter, { worldId, room: "town" });
    expect(
      (await owner.query(api.game.people, { worldId, room: "town" }))[0].restId,
    ).toBeUndefined();
    expect(
      (await owner.query(api.game.snapshot, { worldId })).character,
    ).toEqual(before.character);
    await expect(
      t
        .withIdentity({ subject: "user_outsider" })
        .mutation(api.game.rest, { worldId, furnitureId: null }),
    ).rejects.toThrow();
  });
  test("only one classmate can occupy a chair, and standing frees it", async () => {
    const { owner, worldId, t } = await setup();
    await t.mutation(internal.admin.addMember, {
      worldId,
      subject: "user_classmate",
    });
    const classmate = t.withIdentity({ subject: "user_classmate" });
    const players = [owner, classmate];
    for (const player of players) {
      await player.mutation(api.game.enter, { worldId, room: "school" });
      await player.mutation(api.game.move, { worldId, x: 590, y: 585 });
    }
    const results = await Promise.allSettled(
      players.map((player) =>
        player.mutation(api.game.rest, { worldId, furnitureId: "chair-math" }),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const winner = results.findIndex((result) => result.status === "fulfilled");
    expect(
      (
        await classmate.query(api.game.people, { worldId, room: "school" })
      ).filter((person) => person.restId === "chair-math"),
    ).toHaveLength(1);
    await players[winner].mutation(api.game.rest, {
      worldId,
      furnitureId: null,
    });
    await players[1 - winner].mutation(api.game.rest, {
      worldId,
      furnitureId: "chair-math",
    });
    expect(
      (await owner.query(api.game.people, { worldId, room: "school" })).filter(
        (person) => person.restId === "chair-math",
      ),
    ).toHaveLength(1);
  });
  test("abandoned chairs can be reclaimed and late heartbeats cannot reclaim them again", async () => {
    const { owner, worldId, t } = await setup();
    await t.mutation(internal.admin.addMember, {
      worldId,
      subject: "user_classmate",
    });
    const classmate = t.withIdentity({ subject: "user_classmate" });
    for (const player of [owner, classmate]) {
      await player.mutation(api.game.enter, { worldId, room: "school" });
      await player.mutation(api.game.move, { worldId, x: 590, y: 585 });
    }
    await owner.mutation(api.game.rest, { worldId, furnitureId: "chair-math" });
    const saved = await owner.query(api.game.snapshot, { worldId });
    await t.run(async (ctx) => {
      const position = await ctx.db
        .query("presence")
        .withIndex("by_character", (q) =>
          q.eq("characterId", saved.character.id),
        )
        .unique();
      await ctx.db.patch(position!._id, { updatedAt: Date.now() - 50000 });
    });
    await classmate.mutation(api.game.rest, {
      worldId,
      furnitureId: "chair-math",
    });
    await owner.mutation(api.game.move, {
      worldId,
      x: 480,
      y: 580,
      restId: "chair-math",
    });
    const people = await owner.query(api.game.people, {
      worldId,
      room: "school",
    });
    expect(
      people.find((person) => person.id === saved.character.id),
    ).toMatchObject({ x: 590, y: 585 });
    expect(
      people.find((person) => person.id === saved.character.id)?.restId,
    ).toBeUndefined();
    expect(
      people.filter((person) => person.restId === "chair-math"),
    ).toHaveLength(1);
  });
  test("hotel rooms are shared only within the invited world", async () => {
    const { owner, worldId, t } = await setup();
    await t.mutation(internal.admin.addMember, {
      worldId,
      subject: "user_guest",
    });
    const guest = t.withIdentity({ subject: "user_guest" });
    for (const room of [
      hotel.lobby,
      ...guestRooms.map((entry) => entry.id),
      hotel.dining,
    ]) {
      await owner.mutation(api.game.enter, { worldId, room });
      await guest.mutation(api.game.enter, { worldId, room });
      expect(
        await guest.query(api.game.people, { worldId, room }),
      ).toHaveLength(2);
    }
    await expect(
      owner.mutation(api.game.enter, { worldId, room: "hotel:missing-room" }),
    ).rejects.toThrow();
    await expect(
      t
        .withIdentity({ subject: "user_outsider" })
        .mutation(api.game.enter, { worldId, room: hotel.lobby }),
    ).rejects.toThrow();
    const otherWorld = await t.mutation(internal.admin.createWorld, {
      name: "Other hotel",
      ownerSubject: "user_other",
    });
    await t
      .withIdentity({ subject: "user_other" })
      .mutation(api.game.enter, { worldId: otherWorld, room: hotel.dining });
    expect(
      await owner.query(api.game.people, { worldId, room: hotel.dining }),
    ).toHaveLength(2);
  });
  test("hotel dining is free, dine-in only, and duplicate requests record one meal", async () => {
    const { owner, worldId, t } = await setup();
    const before = await owner.query(api.game.snapshot, { worldId });
    const eat = {
      worldId,
      type: "eatFree" as const,
      itemId: hotelMeals[0].id,
      requestId: "hotel-meal",
    };
    await expect(owner.mutation(api.game.transact, eat)).rejects.toThrow(
      "dining room",
    );
    await owner.mutation(api.game.enter, { worldId, room: guestRooms[0].id });
    await expect(owner.mutation(api.game.transact, eat)).rejects.toThrow(
      "dining room",
    );
    await owner.mutation(api.game.enter, { worldId, room: hotel.dining });
    await expect(
      owner.mutation(api.game.transact, { ...eat, itemId: "berry-milk" }),
    ).rejects.toThrow("hotel menu");
    // Eating works while seated and does not require coins.
    await t.run(async (ctx) => {
      await ctx.db.patch(before.character.id, { balance: 0 });
    });
    await owner.mutation(api.game.move, { worldId, x: 500, y: 715 });
    await owner.mutation(api.game.rest, {
      worldId,
      furnitureId: "hotel-chair-1",
    });
    await owner.mutation(api.game.transact, eat);
    await owner.mutation(api.game.transact, eat);
    for (const meal of hotelMeals.slice(1))
      await owner.mutation(api.game.transact, {
        ...eat,
        itemId: meal.id,
        requestId: meal.id,
      });
    const after = await owner.query(api.game.snapshot, { worldId });
    expect(after.character.balance).toBe(0);
    expect(after.character.inventory).toEqual(before.character.inventory);
    expect(
      after.receipts.filter((receipt) =>
        receipt.label.includes("at the hotel"),
      ),
    ).toHaveLength(hotelMeals.length);
    expect(
      (await owner.query(api.game.people, { worldId, room: hotel.dining }))[0]
        .restId,
    ).toBe("hotel-chair-1");
    await expect(
      t
        .withIdentity({ subject: "user_outsider" })
        .mutation(api.game.transact, eat),
    ).rejects.toThrow();
  });
  test("renaming preserves ownership, home, balance, and inventory", async () => {
    const { owner, worldId } = await setup();
    const before = await owner.query(api.game.snapshot, { worldId });
    await owner.mutation(api.game.profile, {
      worldId,
      name: "  Daisy  ",
      color: "#8c95cc",
    });
    const after = await owner.query(api.game.snapshot, { worldId });
    expect(after.character.id).toBe(before.character.id);
    expect(after.character.name).toBe("Daisy");
    expect(after.homes[0].name).toBe("Daisy");
    expect(after.character.balance).toBe(50);
    await expect(
      owner.mutation(api.game.profile, {
        worldId,
        name: " ",
        color: "#8c95cc",
      }),
    ).rejects.toThrow();
  });
});
