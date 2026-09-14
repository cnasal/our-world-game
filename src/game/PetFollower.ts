import Phaser from "phaser";
import type { Pet } from "../content/pets";

// Follow the owner's recent footsteps so companions turn around furniture too.
export class PetFollower {
  readonly petId: string;
  readonly view: Phaser.GameObjects.Container;
  private trail: { x: number; y: number }[] = [];
  private last: { x: number; y: number };
  constructor(scene: Phaser.Scene, pet: Pet, x: number, y: number) {
    this.petId = pet.id;
    this.last = { x, y };
    const g = scene.add.graphics();
    g.fillStyle(0x48533d, 0.16).fillEllipse(0, 3, 32, 12);
    g.fillStyle(pet.coat).fillEllipse(0, -12, 29, 23);
    if (pet.kind === "duck") {
      g.fillCircle(9, -28, 12);
      g.fillStyle(0xe6a04e).fillTriangle(18, -31, 31, -26, 18, -23);
      g.fillRect(-10, 0, 9, 4).fillRect(5, 0, 9, 4);
      g.fillStyle(0xe5be58).fillEllipse(-3, -12, 17, 12);
      g.fillStyle(0x403b32).fillCircle(12, -30, 2);
    } else {
      g.fillRoundedRect(-12, -5, 8, 10, 3).fillRoundedRect(5, -5, 8, 10, 3);
      g.fillCircle(0, -28, 14);
      if (pet.kind === "cat") {
        g.fillTriangle(-13, -33, -12, -49, -1, -38);
        g.fillTriangle(13, -33, 12, -49, 1, -38);
        g.lineStyle(6, pet.coat)
          .beginPath()
          .moveTo(-12, -12)
          .lineTo(-23, -22)
          .lineTo(-24, -34)
          .strokePath();
      } else {
        g.fillStyle(0x76563e)
          .fillEllipse(-14, -27, 11, 26)
          .fillEllipse(14, -27, 11, 26);
        g.lineStyle(6, pet.coat).lineBetween(-11, -11, -24, -19);
      }
      g.fillStyle(0x403b32).fillCircle(-5, -30, 2).fillCircle(5, -30, 2);
      g.fillStyle(0xf0d6b5).fillEllipse(0, -22, 13, 9);
      g.fillStyle(0x403b32).fillCircle(0, -24, 2);
      g.lineStyle(3, 0x91b4b3).lineBetween(-8, -15, 8, -15);
    }
    this.view = scene.add
      .container(x, y, [g])
      .setName(`pet:${pet.id}`)
      .setDepth(y + 999);
  }
  follow(
    x: number,
    y: number,
    delta: number,
    resting: boolean,
    walkable: (x: number, y: number) => boolean,
  ) {
    // Stay beside a chair or bed while the owner rests.
    if (resting) return;
    if (Math.hypot(x - this.last.x, y - this.last.y) > 160) {
      this.trail = [];
      this.view.setPosition(x, y);
      this.last = { x, y };
    }
    if (Math.hypot(x - this.last.x, y - this.last.y) >= 4) {
      this.trail.push({ x, y });
      this.last = { x, y };
    }
    // Retain roughly one pet-sized gap behind the owner.
    let remaining = 0;
    for (let i = 1; i < this.trail.length; i++)
      remaining += Math.hypot(
        this.trail[i].x - this.trail[i - 1].x,
        this.trail[i].y - this.trail[i - 1].y,
      );
    if (remaining > 42 && this.trail.length) {
      const target = this.trail[0];
      const distance = Math.hypot(
        target.x - this.view.x,
        target.y - this.view.y,
      );
      const step = Math.min(
        1,
        (280 * Math.min(delta, 50)) / 1000 / Math.max(distance, 1),
      );
      const nextX = Phaser.Math.Linear(this.view.x, target.x, step);
      const nextY = Phaser.Math.Linear(this.view.y, target.y, step);
      if (walkable(nextX, nextY)) this.view.setPosition(nextX, nextY);
      else if (walkable(target.x, target.y))
        this.view.setPosition(target.x, target.y);
      if (distance < 5 || step === 1) this.trail.shift();
    }
    this.view.setDepth(this.view.y + 999);
  }
  destroy() {
    this.view.destroy();
  }
}
