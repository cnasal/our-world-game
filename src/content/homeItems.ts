import { seeds } from "./garden";
import { shopItems } from "./town";
export const homeItemSpots = [
  { id: "shelf-left", name: "Shelf, left", x: 610, y: 310 },
  { id: "shelf-right", name: "Shelf, right", x: 725, y: 310 },
  { id: "table-left", name: "Table, left", x: 930, y: 682 },
  { id: "table-right", name: "Table, right", x: 1010, y: 682 },
  { id: "rug-left", name: "Rug, left", x: 665, y: 580 },
  { id: "rug-right", name: "Rug, right", x: 765, y: 580 },
] as const;
export function moveHomeItem(
  inventory: Record<string, number>,
  homeItems: Record<string, string>,
  action: "unpack" | "pack" | "playHome" | "waterHome",
  spotId: string,
  itemId?: string,
) {
  if (!homeItemSpots.some((spot) => spot.id === spotId))
    throw new Error("Choose a spot in your home.");
  const bag = { ...inventory },
    placed = { ...homeItems };
  const item = shopItems.find(
    (entry) => entry.id === (action === "unpack" ? itemId : placed[spotId]),
  );
  if (!item) throw new Error("That item is not here.");
  if (action === "unpack") {
    if (item.shop === "costumes")
      throw new Error(
        "Keep dresses in My outfits so you can wear them anytime.",
      );
    if (placed[spotId])
      throw new Error("That spot is full. Choose an empty spot.");
    if (!(bag[item.id] > 0))
      throw new Error("That item is not in your backpack.");
    bag[item.id]--;
    placed[spotId] = item.id;
  } else if (action === "pack") {
    bag[item.id] = (bag[item.id] ?? 0) + 1;
    delete placed[spotId];
  } else if (action === "waterHome") {
    const seed = seeds.find((entry) => entry.id === item.id);
    if (!seed) throw new Error("Choose a seed pot to water.");
    placed[spotId] = seed.flowerId;
  } else if (item.shop !== "toys")
    throw new Error("Choose a toy to play with.");
  return {
    inventory: bag,
    homeItems: placed,
    label: `${action === "waterHome" ? "Grew" : action === "unpack" ? "Unpacked" : action === "pack" ? "Packed" : "Played with"} ${item.name}`,
  };
}
