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
