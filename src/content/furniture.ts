import { guestRooms, hotel } from "./hotel";
import { schoolStations } from "./school";
export type Furniture = {
  id: string;
  name: string;
  pose: "sit" | "lie";
  x: number;
  y: number;
  approach: { x: number; y: number };
  hit: { x: number; y: number; w: number; h: number };
  chair?: boolean;
};
const homeFurniture: Furniture[] = [
  {
    id: "sofa",
    name: "Sofa",
    pose: "sit",
    x: 465,
    y: 461,
    approach: { x: 465, y: 530 },
    hit: { x: 370, y: 380, w: 193, h: 110 },
  },
  {
    id: "bed",
    name: "Bed",
    pose: "lie",
    x: 981,
    y: 490,
    approach: { x: 865, y: 530 },
    hit: { x: 911, y: 375, w: 144, h: 210 },
  },
  {
    id: "home-chair",
    name: "Comfy chair",
    pose: "sit",
    x: 600,
    y: 735,
    approach: { x: 600, y: 785 },
    hit: { x: 578, y: 700, w: 44, h: 45 },
    chair: true,
  },
];
const schoolFurniture: Furniture[] = schoolStations.map((station) => ({
  id: `chair-${station.lessonId}`,
  name: `${station.name.replace(" desk", "")} chair`,
  pose: "sit",
  x: station.x,
  y: station.y + 50,
  approach: { x: station.x + 110, y: station.y + 55 },
  hit: { x: station.x - 22, y: station.y + 25, w: 44, h: 40 },
  chair: true,
}));
const cafeFurniture: Furniture[] = [
  {
    id: "cafe-chair-left",
    name: "Café chair (left)",
    pose: "sit",
    x: 125,
    y: 436,
    approach: { x: 125, y: 487 },
    hit: { x: 112, y: 410, w: 28, h: 36 },
  },
  {
    id: "cafe-chair-right",
    name: "Café chair (right)",
    pose: "sit",
    x: 185,
    y: 436,
    approach: { x: 185, y: 487 },
    hit: { x: 172, y: 410, w: 28, h: 36 },
  },
];
const hotelSeats: Furniture[] = [500, 940].map((x, i) => ({
  id: `hotel-chair-${i + 1}`,
  name: i === 0 ? "Left chair" : "Right chair",
  pose: "sit",
  x,
  y: 650,
  approach: { x, y: 715 },
  hit: { x: x - 22, y: 617, w: 44, h: 44 },
  chair: true,
}));
export function furnitureFor(room: string): Furniture[] {
  if (room.startsWith("home:") || guestRooms.some((entry) => entry.id === room))
    return homeFurniture;
  if (room === hotel.lobby || room === hotel.dining) return hotelSeats;
  if (room === "school") return schoolFurniture;
  if (room === "town") return cafeFurniture;
  return [];
}
