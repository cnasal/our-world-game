import { furnitureFor } from "./content/furniture";
import { useCallback, useRef, useState } from "react";
import { avatarColors, shopItems, stops, town } from "./content/town";
import type { GameAction, GameBridge, Snapshot } from "./types";
const KEY = "our-world-preview-v1";
function fresh(): Snapshot {
  return {
    worldId: "practice",
    worldName: "Willowbrook",
    character: {
      id: "neighbor-1",
      name: "Neighbor 1",
      color: avatarColors[0],
      balance: 50,
      room: "town",
      ...town.spawn,
      inventory: {},
      delivery: "none",
      deliveries: 0,
    },
    homes: avatarColors.slice(0, 4).map((color, i) => ({
      id: `neighbor-${i + 1}`,
      name: `Neighbor ${i + 1}`,
      color,
    })),
    receipts: [
      {
        id: "welcome",
        label: "A little welcome gift",
        amount: 50,
        at: Date.now(),
      },
    ],
  };
}
function restore() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (data?.character?.id && data?.homes && data?.receipts)
      return data as Snapshot;
  } catch {
    /* Start fresh if storage is unavailable. */
  }
  return fresh();
}
export function usePreview(): GameBridge {
  const [snapshot, setSnapshot] = useState<Snapshot>(restore);
  const current = useRef(snapshot);
  current.current = snapshot;
  const persist = useCallback((s: Snapshot) => {
    current.current = s;
    setSnapshot(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* This preview can run without local storage. */
    }
  }, []);
  const move = useCallback((x: number, y: number) => {
    current.current = {
      ...current.current,
      character: current.current.character.restId
        ? current.current.character
        : { ...current.current.character, x, y },
    };
  }, []);
  const act = useCallback(
    async (action: GameAction) => {
      const s = structuredClone(current.current),
        c = s.character;
      const near = (id: string) => {
        const p = stops.find((x) => x.id === id)!;
        if (c.room !== "town" || Math.hypot(c.x - p.x, c.y - p.y) > 160)
          throw new Error(`Walk to ${p.name} first.`);
      };
      let label = "",
        amount = 0;
      if (
        "requestId" in action &&
        s.receipts.some((r) => r.id === action.requestId)
      )
        return;
      switch (action.type) {
        case "profile":
          if (
            !action.name.trim() ||
            action.name.trim().length > 24 ||
            !avatarColors.includes(action.color)
          )
            throw new Error("Choose a name and color.");
          c.name = action.name.trim();
          c.color = action.color;
          s.homes[0] = { id: c.id, name: c.name, color: c.color };
          break;
        case "room":
          c.room = action.room;
          delete c.restId;
          Object.assign(c, town.spawn);
          break;
        case "rest": {
          const furniture = furnitureFor(c.room);
          if (action.furnitureId === null) {
            const previous = furniture.find((item) => item.id === c.restId);
            if (previous) Object.assign(c, previous.approach);
            delete c.restId;
            break;
          }
          const seat = furniture.find((item) => item.id === action.furnitureId);
          if (!seat) throw new Error("That furniture is not in this room.");
          if (c.restId === seat.id) break;
          if (c.restId) throw new Error("Stand up first.");
          if (Math.hypot(c.x - seat.approach.x, c.y - seat.approach.y) > 95)
            throw new Error(`Walk to the ${seat.name.toLowerCase()} first.`);
          Object.assign(c, { x: seat.x, y: seat.y, restId: seat.id });
          break;
        }
        case "startJob":
          near("post");
          if (c.delivery === "carrying")
            throw new Error("You already have a parcel.");
          c.delivery = "carrying";
          label = "Picked up a café parcel";
          break;
        case "finishJob":
          near("cafe");
          if (c.delivery !== "carrying")
            throw new Error("Pick up a parcel first.");
          c.delivery = "none";
          c.deliveries++;
          amount = 15;
          label = "Café delivery";
          break;
        case "buy":
        case "use": {
          const item = shopItems.find((i) => i.id === action.itemId);
          if (!item) throw new Error("Unknown item.");
          if (action.type === "buy") {
            near(item.shop);
            if (c.balance < item.price)
              throw new Error("Try a delivery to earn a few more coins.");
            c.inventory[item.id] = (c.inventory[item.id] ?? 0) + 1;
            amount = -item.price;
            label = item.name;
          } else {
            if (!(c.inventory[item.id] > 0))
              throw new Error("Your bag is empty.");
            c.inventory[item.id]--;
            label = `Enjoyed ${item.name}`;
          }
        }
      }
      c.balance += amount;
      if (label)
        s.receipts.unshift({
          id: "requestId" in action ? action.requestId : crypto.randomUUID(),
          label,
          amount,
          at: Date.now(),
        });
      s.receipts = s.receipts.slice(0, 20);
      persist(s);
    },
    [persist],
  );
  return {
    snapshot,
    neighbors: [],
    act,
    move,
    emote: () => {},
    mode: "preview",
    connected: true,
  };
}
