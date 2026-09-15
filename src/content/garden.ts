export const gardenShop = {
  name: "Little Bloom Garden Shop",
  welcome:
    "Choose a seed pot for 5 coins. Unpack it at home, then open Pick up items and water it to grow a flower!",
};
export const seeds = [
  {
    id: "seed-sunflower",
    name: "Sunflower seed pot",
    description: "A little seed with a sunny future.",
    price: 5,
    emoji: "🌱",
    color: "#f8efb9",
    flowerId: "flower-sunflower",
  },
  {
    id: "seed-daisy",
    name: "Daisy seed pot",
    description: "Grow a cheerful little daisy.",
    price: 5,
    emoji: "🌱",
    color: "#e6efd8",
    flowerId: "flower-daisy",
  },
  {
    id: "seed-tulip",
    name: "Tulip seed pot",
    description: "A pink surprise waiting to bloom.",
    price: 5,
    emoji: "🌱",
    color: "#f8d9e2",
    flowerId: "flower-tulip",
  },
] as const;
export const flowers = seeds.map((seed, index) => ({
  id: seed.flowerId,
  name: ["Sunflower", "Daisy", "Pink tulip"][index],
  description: "You grew this flower! Keep it in a cozy spot at home.",
  price: seed.price,
  emoji: ["🌻", "🌼", "🌷"][index],
  color: seed.color,
}));
