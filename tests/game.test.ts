import { iceCreams } from "../src/content/iceCream";
import { pets } from "../src/content/pets";
import { shopInteriors } from "../src/content/interiors";
import { deliveryPlaces } from "../src/content/deliveries";
import { stops } from "../src/content/town";
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
  test("every offered destination can receive a parcel exactly once", async () => {
    const { owner, worldId } = await setup();
    const homes = (await owner.query(api.game.snapshot, { worldId })).homes;
    const places = deliveryPlaces(homes);
    for (const [index, place] of places.entries()) {
      await owner.mutation(api.game.enter, { worldId, room: "town" });
      await owner.mutation(api.game.move, { worldId, x: 1110, y: 465 });
      const pickup = {
        worldId,
        type: "startJob" as const,
        destination: place.id,
        requestId: `pickup-${index}`,
      };
      await owner.mutation(api.game.transact, pickup);
      await owner.mutation(api.game.transact, pickup);
      await expect(
        owner.mutation(api.game.transact, {
          ...pickup,
          destination: "cafe",
          requestId: `swap-${index}`,
        }),
      ).rejects.toThrow("already");
      const finish = {
        worldId,
        type: "finishJob" as const,
        requestId: `finish-${index}`,
      };
      await expect(owner.mutation(api.game.transact, finish)).rejects.toThrow();
      if (place.room)
        await owner.mutation(api.game.enter, { worldId, room: place.room });
      else {
        const stop = stops.find((entry) => entry.id === place.stopId)!;
        await owner.mutation(api.game.move, { worldId, x: stop.x, y: stop.y });
      }
      await owner.mutation(api.game.transact, finish);
      await owner.mutation(api.game.transact, finish);
      const saved = await owner.query(api.game.snapshot, { worldId });
      expect(saved.character.balance).toBe(50 + 15 * (index + 1));
      expect(saved.character.deliveries).toBe(index + 1);
      expect(saved.character.deliveryTarget).toBeUndefined();
    }
  });
  test("home deliveries use IDs and reject foreign homes or the wrong recipient", async () => {
    const { owner, worldId, t } = await setup();
    await t.mutation(internal.admin.addMember, {
      worldId,
      subject: "user_recipient",
    });
    const recipient = t.withIdentity({ subject: "user_recipient" });
    const recipientId = (await recipient.query(api.game.snapshot, { worldId }))
      .character.id;
    const ownId = (await owner.query(api.game.snapshot, { worldId })).character
      .id;
    await owner.mutation(api.game.move, { worldId, x: 1110, y: 465 });
    await expect(
      owner.mutation(api.game.transact, {
        worldId,
        type: "startJob",
        destination: "home:unknown",
        requestId: "foreign",
      }),
    ).rejects.toThrow("Choose");
    await owner.mutation(api.game.transact, {
      worldId,
      type: "startJob",
      destination: `home:${recipientId}`,
      requestId: "home-pickup",
    });
    await recipient.mutation(api.game.profile, {
      worldId,
      name: "New nickname",
      color: "#8c95cc",
    });
    await owner.mutation(api.game.enter, { worldId, room: `home:${ownId}` });
    const finish = {
      worldId,
      type: "finishJob" as const,
      destination: `home:${ownId}`,
      requestId: "home-finish",
    };
    await expect(owner.mutation(api.game.transact, finish)).rejects.toThrow(
      "New nickname",
    );
    await owner.mutation(api.game.enter, {
      worldId,
      room: `home:${recipientId}`,
    });
    await owner.mutation(api.game.transact, finish);
    expect(
      (await owner.query(api.game.snapshot, { worldId })).character.balance,
    ).toBe(65);
  });
  test("a café parcel saved before destination choices can still be delivered", async () => {
    const { owner, worldId, t } = await setup();
    const character = (await owner.query(api.game.snapshot, { worldId }))
      .character;
    await t.run(async (ctx) => {
      await ctx.db.patch(character.id, { delivery: "carrying" });
    });
    await owner.mutation(api.game.move, { worldId, x: 332, y: 465 });
    await owner.mutation(api.game.transact, {
      worldId,
      type: "finishJob",
      requestId: "old-parcel",
    });
    expect(
      (await owner.query(api.game.snapshot, { worldId })).character.balance,
    ).toBe(65);
  });
  test("shop interiors are private shared rooms and support their own services", async () => {
    const { owner, worldId, t } = await setup();
    await t.mutation(internal.admin.addMember, {
      worldId,
      subject: "user_shopper",
    });
    const shopper = t.withIdentity({ subject: "user_shopper" });
    for (const shop of shopInteriors) {
      for (const player of [owner, shopper])
        await player.mutation(api.game.enter, { worldId, room: shop.room });
      expect(
        await shopper.query(api.game.people, { worldId, room: shop.room }),
      ).toHaveLength(2);
      await expect(
        t
          .withIdentity({ subject: "user_outsider" })
          .mutation(api.game.enter, { worldId, room: shop.room }),
      ).rejects.toThrow();
    }
    await expect(
      owner.mutation(api.game.enter, { worldId, room: "shop:unknown" }),
    ).rejects.toThrow();
    await owner.mutation(api.game.transact, {
      worldId,
      type: "startJob",
      destination: "restaurant",
      requestId: "inside-pickup",
    });
    await owner.mutation(api.game.enter, { worldId, room: "shop:cafe" });
    await owner.mutation(api.game.transact, {
      worldId,
      type: "buy",
      itemId: "berry-milk",
      requestId: "inside-drink",
    });
    await expect(
      owner.mutation(api.game.transact, {
        worldId,
        type: "buy",
        itemId: "sunny-pizza",
        requestId: "wrong-counter",
      }),
    ).rejects.toThrow();
    await expect(
      owner.mutation(api.game.transact, {
        worldId,
        type: "finishJob",
        requestId: "wrong-shop",
      }),
    ).rejects.toThrow();
    await owner.mutation(api.game.enter, { worldId, room: "shop:restaurant" });
    await owner.mutation(api.game.transact, {
      worldId,
      type: "finishJob",
      requestId: "inside-delivery",
    });
    await owner.mutation(api.game.transact, {
      worldId,
      type: "buy",
      itemId: "sunny-pizza",
      requestId: "inside-meal",
    });
    expect(
      (await owner.query(api.game.snapshot, { worldId })).character.balance,
    ).toBe(47);
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

test("toys charge once, require ownership, and stay in the bag after playing", async () => {
  const { t, owner, worldId } = await setup();
  const buy = {
    worldId,
    type: "buy" as const,
    itemId: "toy-teddy",
    requestId: "toy-purchase",
  };
  await expect(owner.mutation(api.game.transact, buy)).rejects.toThrow();
  await owner.mutation(api.game.enter, { worldId, room: "shop:toys" });
  await expect(
    t.withIdentity({ subject: "outsider" }).mutation(api.game.transact, buy),
  ).rejects.toThrow();
  await expect(
    owner.mutation(api.game.transact, {
      ...buy,
      type: "use",
      requestId: "unowned",
    }),
  ).rejects.toThrow();
  await owner.mutation(api.game.transact, buy);
  await owner.mutation(api.game.transact, buy);
  for (const requestId of ["play-one", "play-one", "play-two"])
    await owner.mutation(api.game.transact, { ...buy, type: "use", requestId });
  const { character } = await owner.query(api.game.snapshot, { worldId });
  expect(character.balance).toBe(40);
  expect(character.inventory["toy-teddy"]).toBe(1);
  expect(deliveryPlaces([]).find((place) => place.id === "toys")?.room).toBe(
    "shop:toys",
  );
});

test.each(pets)(
  "adopting a $name costs 80 coins, stays out of the bag, and is shared",
  async (pet) => {
    const { t, owner, worldId } = await setup();
    const adopt = {
      worldId,
      type: "adopt" as const,
      itemId: pet.id,
      requestId: "adopt-once",
    };
    await expect(owner.mutation(api.game.transact, adopt)).rejects.toThrow(
      "Come inside",
    );
    await owner.mutation(api.game.enter, { worldId, room: "shop:shelter" });
    await expect(owner.mutation(api.game.transact, adopt)).rejects.toThrow(
      "coins",
    );
    const initial = await owner.query(api.game.snapshot, { worldId });
    await t.run(async (ctx) => {
      await ctx.db.patch(initial.character.id, { balance: 100 });
    });
    await expect(
      t
        .withIdentity({ subject: "stranger" })
        .mutation(api.game.transact, adopt),
    ).rejects.toThrow();
    await expect(
      owner.mutation(api.game.transact, { ...adopt, itemId: "invented-pet" }),
    ).rejects.toThrow("Choose a pet");
    await owner.mutation(api.game.transact, adopt);
    await owner.mutation(api.game.transact, adopt);
    const state = await owner.query(api.game.snapshot, { worldId });
    expect(state.character.petId).toBe(pet.id);
    expect(state.character.balance).toBe(20);
    expect(state.character.inventory).toEqual(initial.character.inventory);
    expect(
      state.receipts.filter((r) => r.label === `Adopted ${pet.name}`),
    ).toHaveLength(1);
    await expect(
      owner.mutation(api.game.transact, {
        ...adopt,
        requestId: "another-pet",
        itemId: pets.find((p) => p.id !== pet.id)!.id,
      }),
    ).rejects.toThrow("already have a pet");
    await owner.mutation(api.game.enter, { worldId, room: "school" });
    const people = await owner.query(api.game.people, {
      worldId,
      room: "school",
    });
    expect(people.find((p) => p.id === state.character.id)?.petId).toBe(pet.id);
    expect(
      (await owner.query(api.game.snapshot, { worldId })).character.petId,
    ).toBe(pet.id);
  },
);

test("simultaneous adoption requests cannot buy two pets", async () => {
  const { t, owner, worldId } = await setup();
  await owner.mutation(api.game.enter, { worldId, room: "shop:shelter" });
  const state = await owner.query(api.game.snapshot, { worldId });
  await t.run(async (ctx) => {
    await ctx.db.patch(state.character.id, { balance: 200 });
  });
  const results = await Promise.allSettled(
    pets.slice(0, 2).map((pet) =>
      owner.mutation(api.game.transact, {
        worldId,
        type: "adopt",
        itemId: pet.id,
        requestId: pet.id,
      }),
    ),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const final = await owner.query(api.game.snapshot, { worldId });
  expect(final.character.balance).toBe(120);
  expect(final.character.inventory).toEqual({});
});

test("ice cream purchases require the right shop and can be enjoyed only once", async () => {
  const { owner, worldId } = await setup();
  const item = iceCreams[0];
  const buy = {
    worldId,
    type: "buy" as const,
    itemId: item.id,
    requestId: "ice-cream-buy",
  };
  await owner.mutation(api.game.enter, { worldId, room: "shop:cafe" });
  await expect(owner.mutation(api.game.transact, buy)).rejects.toThrow();
  await owner.mutation(api.game.enter, { worldId, room: "town" });
  await owner.mutation(api.game.move, { worldId, x: 1910, y: 465 });
  expect(
    (await owner.query(api.game.people, { worldId, room: "town" }))[0].x,
  ).toBe(1910);
  await owner.mutation(api.game.enter, { worldId, room: "shop:icecream" });
  await owner.mutation(api.game.transact, buy);
  await owner.mutation(api.game.transact, buy);
  let state = await owner.query(api.game.snapshot, { worldId });
  expect(state.character.balance).toBe(45);
  expect(state.character.inventory[item.id]).toBe(1);
  await owner.mutation(api.game.enter, { worldId, room: "town" });
  const enjoy = { ...buy, type: "use" as const, requestId: "ice-cream-enjoy" };
  await owner.mutation(api.game.transact, enjoy);
  await owner.mutation(api.game.transact, enjoy);
  await expect(
    owner.mutation(api.game.transact, { ...enjoy, requestId: "empty-scoop" }),
  ).rejects.toThrow();
  state = await owner.query(api.game.snapshot, { worldId });
  expect(state.character.inventory[item.id]).toBe(0);
  expect(state.character.balance).toBe(45);
});
