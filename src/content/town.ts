import { iceCreamShop, iceCreams } from "./iceCream";
import { shelter } from "./pets";
import { toyStore, toys } from "./toys";
import { hotel } from "./hotel";
import { school } from "./school";
import { library } from "./library";

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
export const restaurant = {
  name: "The Nasal Restaurant",
  welcome:
    "Welcome, hungry neighbor! Choose something tasty, then open your bag to enjoy it.",
};
export const meals = [
  {
    id: "restaurant-spaghetti",
    name: "Spaghetti",
    description: "Twirl your noodles in tasty tomato sauce.",
    price: 11,
    emoji: "🍝",
    color: "#f8dfb9",
  },
  {
    id: "restaurant-sorbet",
    name: "Sorbet",
    description: "A cool, fruity scoop for a sweet treat.",
    price: 5,
    emoji: "🍧",
    color: "#f8d9e2",
  },
  {
    id: "restaurant-hamburger",
    name: "Hamburger",
    description: "A juicy burger tucked into a soft bun.",
    price: 12,
    emoji: "🍔",
    color: "#deebca",
  },
  {
    id: "restaurant-lemonade",
    name: "Lemonade",
    description: "A sunny glass of sweet and tangy lemonade.",
    price: 6,
    emoji: "🍋",
    color: "#f8efb9",
  },
  {
    id: "sunny-pizza",
    name: "Pizza",
    description: "A cheesy slice with tasty tomato sauce.",
    price: 10,
    emoji: "🍕",
    color: "#f8dfb9",
  },
] as const;
// Earlier menu items stay in the catalog so saved treats can still be enjoyed.
const earlierMeals = [
  {
    id: "garden-soup",
    name: "Garden soup",
    description: "A warm bowl full of colorful vegetables.",
    price: 7,
    emoji: "🍲",
    color: "#deebca",
  },
  {
    id: "fluffy-pancakes",
    name: "Fluffy pancakes",
    description: "A cozy stack with sweet berries on top.",
    price: 9,
    emoji: "🥞",
    color: "#f6dfd6",
  },
] as const;
// Keep item IDs forever, even when changing a meal's name.
export const shopItems = [
  ...iceCreams.map((item) => ({ ...item, shop: "icecream" as const })),
  ...toys.map((item) => ({ ...item, shop: "toys" as const })),
  ...drinks.map((item) => ({ ...item, shop: "cafe" as const })),
  ...[...meals, ...earlierMeals].map((item) => ({
    ...item,
    shop: "restaurant" as const,
  })),
];
export const avatarColors = [
  "#db856f",
  "#8c95cc",
  "#78a58d",
  "#d4ae58",
  "#7ba9bf",
  "#bf87ab",
];
export const town = { width: 2100, height: 1040, spawn: { x: 720, y: 665 } };
export const stops = [
  { id: "icecream", name: iceCreamShop.name, x: 1910, y: 465 },
  { id: "shelter", name: shelter.name, x: 1610, y: 815 },
  { id: "toys", name: toyStore.name, x: 1360, y: 415 },
  { id: "cafe", name: "Cloud Café", x: 332, y: 465 },
  { id: "restaurant", name: restaurant.name, x: 705, y: 405 },
  { id: "hotel", name: hotel.name, x: 1610, y: 485 },
  { id: "post", name: "Little Post", x: 1110, y: 465 },
  { id: "library", name: library.name, x: 160, y: 795 },
  { id: "school", name: school.name, x: 1275, y: 795 },
  { id: "home", name: "Home", x: 450, y: 830 },
  { id: "neighbors", name: "Neighbor homes", x: 990, y: 830 },
] as const;
export type StopId = (typeof stops)[number]["id"];
