export const costumeStore = {
  name: "Fancy Dress Boutique",
  welcome:
    "Pink, yellow, or blue? Choose a fancy dress! Buy it once, then open My outfits to wear it whenever you like.",
};
export const costumes = [
  {
    id: "dress-pink",
    name: "Pink party dress",
    description: "A rosy dress with a pretty bow and pearl trim.",
    price: 15,
    emoji: "👗",
    color: "#f8d9e2",
    fabric: "#df8faf",
    trim: "#fff3ed",
  },
  {
    id: "dress-yellow",
    name: "Yellow sunshine dress",
    description: "A golden dress for bright and happy days.",
    price: 15,
    emoji: "👗",
    color: "#f8efb9",
    fabric: "#e8c65b",
    trim: "#fff9e5",
  },
  {
    id: "dress-blue",
    name: "Blue ballroom dress",
    description: "A sky-blue dress for a lovely little twirl.",
    price: 15,
    emoji: "👗",
    color: "#dce9f8",
    fabric: "#82b4df",
    trim: "#eff7ff",
  },
] as const;
export function costumeFor(id?: string) {
  return costumes.find((item) => item.id === id);
}
export function chooseOutfit(
  inventory: Record<string, number>,
  itemId?: string,
) {
  if (itemId === "everyday") return undefined;
  const dress = costumeFor(itemId);
  if (!dress || !(inventory[dress.id] > 0))
    throw new Error("Choose a dress you own first.");
  return dress.id;
}
