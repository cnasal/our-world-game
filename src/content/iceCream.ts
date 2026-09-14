export const iceCreamShop = {
  name: "The Nasal Ice Cream Shop",
  welcome:
    "Pick a scoop of happiness! Each ice cream costs 5 coins. Find your treat in your bag whenever you’re ready to enjoy it.",
};
export type IceCream = {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  color: string;
};
// The family chooses the flavors. Keep saved item IDs stable.
export const iceCreams: IceCream[] = [
  {
    id: "icecream-chocolate",
    name: "Chocolate",
    description: "A rich, chocolatey scoop for a happy treat.",
    price: 5,
    emoji: "🍨",
    color: "#dfc4ae",
  },
  {
    id: "icecream-vanilla",
    name: "Vanilla",
    description: "A sweet and creamy classic.",
    price: 5,
    emoji: "🍦",
    color: "#f7edcf",
  },
  {
    id: "icecream-mint-chip",
    name: "Mint chip",
    description: "Cool mint with little chocolate chips.",
    price: 5,
    emoji: "🍨",
    color: "#d9ebd3",
  },
  {
    id: "icecream-strawberry",
    name: "Strawberry",
    description: "A pink scoop bursting with berry sweetness.",
    price: 5,
    emoji: "🍨",
    color: "#f4d0db",
  },
  {
    id: "icecream-peach",
    name: "Peach",
    description: "A sunny scoop of sweet peach flavor.",
    price: 5,
    emoji: "🍨",
    color: "#f8dcc1",
  },
  {
    id: "icecream-black-cherry",
    name: "Black cherry",
    description: "A creamy scoop with deep cherry sweetness.",
    price: 5,
    emoji: "🍨",
    color: "#e9cbdc",
  },
];
