import { shelter } from "./pets";
import { toyStore } from "./toys";
import { restaurant } from "./town";
import { library } from "./library";
export const shopInteriors = [
  {
    id: "shelter",
    room: "shop:shelter",
    name: shelter.name,
    action: "Meet the pets",
    wall: 0xdcebd5,
  },
  {
    id: "toys",
    room: "shop:toys",
    name: toyStore.name,
    action: "Browse toys",
    wall: 0xdde4f5,
  },
  {
    id: "cafe",
    room: "shop:cafe",
    name: "Cloud Café",
    action: "Order drinks",
    wall: 0xf0ddcd,
  },
  {
    id: "restaurant",
    room: "shop:restaurant",
    name: restaurant.name,
    action: "Order food",
    wall: 0xf0dfb9,
  },
  {
    id: "library",
    room: "shop:library",
    name: library.name,
    action: "Choose a book",
    wall: 0xe3d9e8,
  },
  {
    id: "post",
    room: "shop:post",
    name: "Little Post",
    action: "Pick up a package",
    wall: 0xd5e3d9,
  },
] as const;
export function shopFor(room: string) {
  return shopInteriors.find((shop) => shop.room === room);
}
export const shopCounter = { id: "shop-counter", x: 720, y: 440 };
