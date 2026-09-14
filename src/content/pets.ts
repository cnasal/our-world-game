export const shelter = {
  name: "The Nasal Animal Shelter",
  welcome:
    "Meet a friend to share your adventures! Your pet follows you around and stays out of your backpack. One pet per person.",
};
export type Pet = {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  color: string;
  coat: number;
  kind: "cat" | "dog" | "duck";
};
// The family chooses which pets live here and what they cost.
export const pets: Pet[] = [
  {
    id: "pet-cat",
    name: "Cat",
    description: "A curious little friend with a gentle purr.",
    price: 80,
    emoji: "🐱",
    color: "#f2dfc6",
    coat: 0xd6a06b,
    kind: "cat",
  },
  {
    id: "pet-dog",
    name: "Dog",
    description: "A cheerful buddy with a wagging tail.",
    price: 80,
    emoji: "🐶",
    color: "#f1e3d5",
    coat: 0xb58a65,
    kind: "dog",
  },
  {
    id: "pet-duck",
    name: "Duck",
    description: "A waddling pal with a friendly quack.",
    price: 80,
    emoji: "🦆",
    color: "#f8efb9",
    coat: 0xf2d978,
    kind: "duck",
  },
];
export const petFor = (id?: string) => pets.find((pet) => pet.id === id);
