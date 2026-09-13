// Start here when adding things to the town. Prices are pretend coins.
export const drinks = [
  {
    id: "berry-milk",
    name: "Berry cloud milk",
    description: "A little pink cloud in a cup.",
    price: 8,
    emoji: "🥛",
    color: "#f8d9e2",
  },
  {
    id: "rainbow-cocoa",
    name: "Rainbow cocoa",
    description: "Chocolate, sprinkles, and a wish.",
    price: 12,
    emoji: "☕",
    color: "#f2e0cb",
  },
  {
    id: "sunshine-lemonade",
    name: "Sunshine lemonade",
    description: "A sunny sip for your adventures.",
    price: 6,
    emoji: "🍋",
    color: "#f8efb9",
  },
] as const;
export const avatarColors = [
  "#db856f",
  "#8c95cc",
  "#78a58d",
  "#d4ae58",
  "#7ba9bf",
  "#bf87ab",
];
export const town = { width: 1440, height: 1040, spawn: { x: 720, y: 665 } };
export const stops = [
  { id: "cafe", name: "Cloud Café", x: 332, y: 465 },
  { id: "post", name: "Little Post", x: 1110, y: 465 },
  { id: "home", name: "Home", x: 450, y: 830 },
  { id: "neighbors", name: "Neighbor homes", x: 990, y: 830 },
] as const;
export type StopId = (typeof stops)[number]["id"];
