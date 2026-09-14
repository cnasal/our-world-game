import { transferCoins } from "./content/bank";
import { validHomeStyle } from "./content/homes";
import { petFor } from "./content/pets";
import { shopFor } from "./content/interiors";
import { atDelivery, deliveryPlaces } from "./content/deliveries";
import { hotel, hotelMeals } from "./content/hotel";
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
        if (c.room === `shop:${id}` && shopFor(c.room)) return;
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
        case "deposit":
        case "withdraw": {
          if (c.room !== "shop:bank")
            throw new Error("Come inside the bank to move your coins.");
          const next = transferCoins(
            c.balance,
            c.savings ?? 0,
            action.type,
            action.coins,
          );
          amount = next.balance - c.balance;
          c.savings = next.savings;
          label =
            action.type === "deposit"
              ? "Put coins into savings"
              : "Took coins out of savings";
          break;
        }
        case "adopt": {
          if (c.room !== "shop:shelter")
            throw new Error("Come inside the animal shelter to choose a pet.");
          if (c.petId)
            throw new Error("You already have a pet. One friend at a time!");
          const pet = petFor(action.itemId);
          if (!pet) throw new Error("Choose a pet from the shelter.");
          if (c.balance < pet.price)
            throw new Error("Try a delivery to earn a few more coins.");
          c.petId = pet.id;
          amount = -pet.price;
          label = `Adopted ${pet.name}`;
          break;
        }
        case "decorate": {
          const homeStyle = {
            wallColor: action.wallColor,
            floorColor: action.floorColor,
          };
          if (!validHomeStyle(homeStyle))
            throw new Error("Choose colors from the home palette.");
          s.homes = s.homes.map((home) =>
            home.id === c.id ? { ...home, homeStyle } : home,
          );
          break;
        }
        case "profile":
          if (
            !action.name.trim() ||
            action.name.trim().length > 24 ||
            !avatarColors.includes(action.color)
          )
            throw new Error("Choose a name and color.");
          c.name = action.name.trim();
          c.color = action.color;
          s.homes = s.homes.map((home) =>
            home.id === c.id ? { ...home, name: c.name, color: c.color } : home,
          );
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
        case "eatFree": {
          if (c.room !== hotel.dining)
            throw new Error("Visit the hotel dining room for a free meal.");
          const meal = hotelMeals.find((item) => item.id === action.itemId);
          if (!meal) throw new Error("Choose a meal from the hotel menu.");
          label = `Enjoyed ${meal.name} at the hotel`;
          break;
        }
        case "startJob": {
          near("post");
          if (c.delivery === "carrying")
            throw new Error("You already have a parcel.");
          const destination = deliveryPlaces(s.homes).find(
            (place) => place.id === (action.destination ?? "cafe"),
          );
          if (!destination)
            throw new Error("Choose a delivery place in this town.");
          c.delivery = "carrying";
          c.deliveryTarget = destination.id;
          label = `Picked up a parcel for ${destination.name}`;
          break;
        }
        case "finishJob": {
          if (c.delivery !== "carrying")
            throw new Error("Pick up a parcel first.");
          const destination = deliveryPlaces(s.homes).find(
            (place) => place.id === (c.deliveryTarget ?? "cafe"),
          );
          if (!destination || !atDelivery(destination, c))
            throw new Error(
              `Bring your parcel to ${destination?.name ?? "its destination"} first.`,
            );
          c.delivery = "none";
          delete c.deliveryTarget;
          c.deliveries++;
          amount = 15;
          label = `Delivery to ${destination.name}`;
          break;
        }
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
            if (item.shop !== "toys") c.inventory[item.id]--;
            label =
              item.shop === "toys"
                ? `Played with ${item.name}`
                : `Enjoyed ${item.name}`;
          }
        }
      }
      c.balance += amount;
      if (label)
        s.receipts.unshift({
          id:
            ("requestId" in action ? action.requestId : undefined) ??
            crypto.randomUUID(),
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
