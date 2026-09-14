export type HomeStyle = { wallColor: string; floorColor: string };
export const wallColors = [
  { name: "Garden green", color: "#d9dfc3" },
  { name: "Sky blue", color: "#cfe3ef" },
  { name: "Rosy pink", color: "#f0d3df" },
  { name: "Lavender", color: "#ded5ed" },
  { name: "Sunny yellow", color: "#f5e8b8" },
  { name: "Warm cream", color: "#f5ead5" },
];
export const floorColors = [
  { name: "Honey wood", color: "#dfbd96" },
  { name: "Light wood", color: "#ecd8b9" },
  { name: "Walnut wood", color: "#ae8a6b" },
  { name: "Soft gray", color: "#c7c9c6" },
];
export const defaultHomeStyle: HomeStyle = {
  wallColor: wallColors[0].color,
  floorColor: floorColors[0].color,
};
export function validHomeStyle(style: HomeStyle) {
  return (
    wallColors.some((option) => option.color === style.wallColor) &&
    floorColors.some((option) => option.color === style.floorColor)
  );
}
