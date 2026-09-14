export const toyStore = {
  name: "The Nasal Toy Store",
  welcome:
    "Pick a new friend or a little adventure! Toys go in your bag, and you can play with them again and again.",
};
export const toys = [
  {
    id: "toy-teddy",
    name: "Teddy bear",
    description: "A cuddly friend for every adventure.",
    price: 10,
    emoji: "🧸",
    color: "#f2dfc6",
  },
  {
    id: "toy-car",
    name: "Little race car",
    description: "Ready, set, zoom!",
    price: 8,
    emoji: "🚗",
    color: "#f8d9e2",
  },
  {
    id: "toy-blocks",
    name: "Rainbow blocks",
    description: "Imagine a castle, a town, or a tower.",
    price: 12,
    emoji: "🧱",
    color: "#deebca",
  },
  {
    id: "toy-robot",
    name: "Friendly robot",
    description: "Beep boop! Your new pretend helper.",
    price: 15,
    emoji: "🤖",
    color: "#dce5f5",
  },
  {
    id: "toy-ball",
    name: "Bouncy ball",
    description: "A bright ball for a happy play break.",
    price: 6,
    emoji: "⚽",
    color: "#f8efb9",
  },
  {
    id: "toy-stuffed-duck",
    name: "Stuffed duck",
    description: "A soft, fluffy friend with a happy little quack.",
    price: 15,
    emoji: "🦆",
    color: "#f8efb9",
  },
  {
    id: "toy-balloons",
    name: "Set of balloons",
    description: "A colorful bunch for a pretend party any day.",
    price: 10,
    emoji: "🎈",
    color: "#f8d9e2",
  },
] as const;
