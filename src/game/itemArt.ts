import type Phaser from "phaser";

// Small code-drawn objects stay visible even on devices without emoji fonts.
export function itemArt(scene: Phaser.Scene, id: string, shop: string) {
  const g = scene.add.graphics();
  const circle = (x: number, y: number, r: number, color: number) =>
    g.fillStyle(color).fillCircle(x, y, r);
  const box = (x: number, y: number, w: number, h: number, color: number) =>
    g.fillStyle(color).fillRoundedRect(x, y, w, h, 3);
  if (shop === "garden") {
    box(-13, -8, 26, 19, 0xbc805f);
    box(-16, -12, 32, 7, 0xd89b73);
    g.lineStyle(4, 0x719451).lineBetween(0, -12, 0, -35);
    g.fillStyle(0x8aaf68).fillEllipse(-7, -22, 15, 7);
    if (id.startsWith("flower-")) {
      const color = id.includes("tulip")
        ? 0xe6a1b2
        : id.includes("daisy")
          ? 0xfff9e8
          : 0xf1cf61;
      for (let n = 0; n < 6; n++)
        circle(
          Math.cos((n * Math.PI) / 3) * 9,
          -36 + Math.sin((n * Math.PI) / 3) * 9,
          7,
          color,
        );
      circle(0, -36, 6, 0xb58951);
    }
  } else if (id === "toy-stuffed-duck") {
    g.fillStyle(0xf1d263).fillEllipse(-3, -10, 29, 20).fillCircle(8, -24, 10);
    g.fillStyle(0xe3a04d).fillTriangle(15, -27, 27, -23, 15, -20);
    circle(10, -26, 2, 0x4b4936);
    g.fillStyle(0xe7bc4f).fillEllipse(-6, -10, 17, 12);
  } else if (id === "toy-teddy") {
    circle(-10, -28, 7, 0xb8875d);
    circle(10, -28, 7, 0xb8875d);
    circle(0, -22, 13, 0xc79a70);
    circle(0, -4, 13, 0xc79a70);
    circle(-13, -6, 6, 0xb8875d);
    circle(13, -6, 6, 0xb8875d);
    circle(-5, -24, 2, 0x493b30);
    circle(5, -24, 2, 0x493b30);
    circle(0, -18, 3, 0x493b30);
  } else if (id === "toy-car") {
    box(-23, -17, 46, 19, 0xc97670);
    box(-12, -29, 27, 17, 0xc97670);
    box(-8, -26, 17, 10, 0xc8e2e2);
    circle(-14, 2, 6, 0x4c5150);
    circle(15, 2, 6, 0x4c5150);
  } else if (id === "toy-blocks") {
    box(-21, -14, 19, 19, 0xc9857c);
    box(2, -14, 19, 19, 0x92b38a);
    box(-9, -35, 19, 19, 0x959dc6);
  } else if (id === "toy-robot") {
    box(-15, -34, 30, 18, 0x96adbf);
    box(-12, -13, 24, 18, 0xaac0cc);
    circle(-6, -26, 3, 0xfff6c7);
    circle(6, -26, 3, 0xfff6c7);
    box(-21, -12, 7, 17, 0x96adbf);
    box(14, -12, 7, 17, 0x96adbf);
  } else if (id === "toy-ball") {
    circle(0, -14, 21, 0xfff9e8);
    circle(0, -14, 8, 0x67756a);
    g.lineStyle(3, 0x67756a)
      .strokeCircle(0, -14, 21)
      .lineBetween(-19, -23, -8, -17)
      .lineBetween(9, -17, 19, -23)
      .lineBetween(0, -6, 0, 6);
  } else if (id === "toy-balloons") {
    g.lineStyle(1, 0x8b7c66)
      .lineBetween(-13, -23, 0, 8)
      .lineBetween(0, -33, 0, 8)
      .lineBetween(13, -23, 0, 8);
    circle(-13, -25, 10, 0xcf899d);
    circle(13, -25, 10, 0x8dafbc);
    circle(0, -36, 10, 0xe0c16c);
  } else if (shop === "icecream" || id.includes("sorbet")) {
    g.fillStyle(0xd8ac72).fillTriangle(-13, -12, 13, -12, 0, 12);
    circle(
      0,
      -23,
      16,
      id.includes("chocolate")
        ? 0x9b7056
        : id.includes("mint")
          ? 0xb2d5ab
          : id.includes("vanilla")
            ? 0xf4e7c8
            : id.includes("peach")
              ? 0xeebd97
              : 0xd49caf,
    );
  } else if (shop === "cafe" || id.includes("lemonade")) {
    box(-13, -25, 26, 30, 0xf5e7cd);
    g.lineStyle(4, 0xf5e7cd).strokeCircle(15, -14, 8);
    g.fillStyle(0xcda180).fillEllipse(0, -24, 22, 7);
  } else {
    g.fillStyle(0xfff9e8).fillEllipse(0, -7, 47, 27);
    g.fillStyle(0xdbb176).fillEllipse(0, -11, 33, 19);
    circle(-7, -12, 4, 0xbf7963);
    circle(8, -9, 4, 0x8fa36f);
  }
  return g;
}
