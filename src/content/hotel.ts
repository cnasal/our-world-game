export const hotel = {
  name: "The Nasal Hotel",
  lobby: "hotel:lobby",
  dining: "hotel:dining",
};
export const guestRooms = [
  { id: "hotel:cloud", name: "Cloud room", color: 0xa9cbd6 },
  { id: "hotel:sunflower", name: "Sunflower room", color: 0xe0bf76 },
  { id: "hotel:star", name: "Star room", color: 0xb5a2cd },
] as const;
export function isHotelRoom(room: string) {
  return (
    room === hotel.lobby ||
    room === hotel.dining ||
    guestRooms.some((entry) => entry.id === room)
  );
}
export function hotelRoomName(room: string) {
  return room === hotel.lobby
    ? `${hotel.name} · Lobby`
    : room === hotel.dining
      ? "Hotel dining room"
      : guestRooms.find((entry) => entry.id === room)?.name;
}
export type HotelStop = {
  id: string;
  name: string;
  x: number;
  y: number;
  target?: string;
};
export function hotelStops(room: string): HotelStop[] {
  if (room === hotel.lobby)
    return [
      ...guestRooms.map((entry, i) => ({
        id: `door:${entry.id}`,
        name: entry.name,
        target: entry.id,
        x: 420 + i * 200,
        y: 430,
      })),
      {
        id: "door:hotel:dining",
        name: "Dining room",
        target: hotel.dining,
        x: 1020,
        y: 430,
      },
      { id: "exit", name: "Back to town", target: "town", x: 720, y: 830 },
    ];
  if (!isHotelRoom(room)) return [];
  return [
    ...(room === hotel.dining
      ? [{ id: "hotel-buffet", name: "Free buffet", x: 720, y: 430 }]
      : []),
    { id: "exit", name: "Back to lobby", target: hotel.lobby, x: 720, y: 830 },
  ];
}
// Hotel meals are eaten here for free, rather than added to the bag.
export const hotelMeals = [
  {
    id: "hotel-spaghetti",
    name: "Spaghetti",
    emoji: "🍝",
    description: "A warm plate of twirly noodles.",
    color: "#f8dfb9",
  },
  {
    id: "hotel-pancakes",
    name: "Pancakes",
    emoji: "🥞",
    description: "A fluffy stack with berries.",
    color: "#f6dfd6",
  },
  {
    id: "hotel-fruit",
    name: "Fruit bowl",
    emoji: "🍓",
    description: "A colorful bowl of juicy fruit.",
    color: "#deebca",
  },
  {
    id: "hotel-lemonade",
    name: "Lemonade",
    emoji: "🍋",
    description: "A sweet and sunny sip.",
    color: "#f8efb9",
  },
] as const;
