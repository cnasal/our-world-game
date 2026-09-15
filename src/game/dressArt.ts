import Phaser from "phaser";
import { costumeFor } from "../content/costumes";
export function drawDress(g: Phaser.GameObjects.Graphics, id?: string) {
  const dress = costumeFor(id);
  if (!dress) return;
  const fabric = Phaser.Display.Color.HexStringToColor(dress.fabric).color;
  const trim = Phaser.Display.Color.HexStringToColor(dress.trim).color;
  g.fillStyle(fabric).fillRoundedRect(-16, -39, 32, 19, 6);
  g.fillStyle(fabric)
    .fillTriangle(-11, -27, -29, 3, 29, 3)
    .fillTriangle(-11, -27, 11, -27, 29, 3);
  g.lineStyle(3, trim)
    .lineBetween(-25, 0, 25, 0)
    .lineBetween(-12, -25, 12, -25);
  g.fillStyle(trim)
    .fillTriangle(0, -25, -8, -30, -8, -20)
    .fillTriangle(0, -25, 8, -30, 8, -20);
  for (const x of [-15, -5, 5, 15]) g.fillCircle(x, -5, 1.5);
}
