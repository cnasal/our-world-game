import { shopInteriors } from "./interiors";
import { stops } from "./town";
import { guestRooms, hotel } from "./hotel";
export type DeliveryPlace = {
  id: string;
  name: string;
  stopId?: string;
  room?: string;
  outside?: boolean;
};
export function deliveryPlaces(
  homes: { id: string; name: string }[],
): DeliveryPlace[] {
  return [
    ...stops
      .filter((stop) =>
        ["toys", "cafe", "restaurant", "library", "school", "hotel"].includes(
          stop.id,
        ),
      )
      .map((stop) => ({
        id: stop.id,
        name: stop.name,
        stopId: stop.id,
        room:
          stop.id === "school"
            ? "school"
            : stop.id === "hotel"
              ? hotel.lobby
              : shopInteriors.find((shop) => shop.id === stop.id)?.room,
        outside: true,
      })),
    ...homes.map((home) => ({
      id: `home:${home.id}`,
      name: `${home.name}’s home`,
      room: `home:${home.id}`,
    })),
    ...guestRooms.map((room) => ({
      id: room.id,
      name: `Hotel · ${room.name}`,
      room: room.id,
    })),
    { id: hotel.dining, name: "Hotel dining room", room: hotel.dining },
  ];
}
export function atDelivery(
  place: DeliveryPlace,
  position: { room: string; x: number; y: number },
) {
  if (place.room === position.room) return true;
  const stop = stops.find((entry) => entry.id === place.stopId);
  return Boolean(
    place.outside &&
    stop &&
    position.room === "town" &&
    Math.hypot(position.x - stop.x, position.y - stop.y) <= 160,
  );
}
