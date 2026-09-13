import { library } from "../content/library";
import Phaser from "phaser";
import { restaurant, stops, town } from "../content/town";
import type { Neighbor, Snapshot } from "../types";
type Rect = { x: number; y: number; w: number; h: number };
type Callbacks = {
  move: (x: number, y: number) => void;
  nearby: (id: string | null) => void;
  interact: (id: string) => void;
  initial: () => { snapshot: Snapshot; neighbors: Neighbor[] };
};
export class TownScene extends Phaser.Scene {
  private avatar!: Phaser.GameObjects.Container;
  private others = new Map<
    string,
    { view: Phaser.GameObjects.Container; target: Neighbor; stamp: number }
  >();
  private obstacles: Rect[] = [];
  private path: { x: number; y: number }[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private lastSend = 0;
  private wasMoving = false;
  private lastNearby: string | null = null;
  private elapsed = 0;
  private room = "";
  private created = false;
  private current?: Snapshot;
  private bubble?: Phaser.GameObjects.Text;
  private bubbleUntil = 0;
  private pausedInput = false;
  private arrival?: string;
  constructor(private callbacks: Callbacks) {
    super("town");
  }
  create() {
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,E",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on("keydown-E", () => {
      if (this.lastNearby && !this.pausedInput)
        this.callbacks.interact(this.lastNearby);
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.pausedInput || !this.avatar) return;
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.room === "town") {
        const hit = stops.find(
          (s) => Math.abs(s.x - p.x) < 145 && p.y > s.y - 245 && p.y < s.y + 30,
        );
        if (hit) {
          this.goTo(hit.id);
          return;
        }
      }
      this.arrival = undefined;
      this.path = this.findPath(p.x, p.y);
    });
    this.scale.on("resize", this.resizeCamera, this);
    this.events.once("shutdown", () =>
      this.scale.off("resize", this.resizeCamera, this),
    );
    this.created = true;
    const initial = this.callbacks.initial();
    this.sync(initial.snapshot, initial.neighbors);
    this.setPaused(this.pausedInput);
  }
  private resizeCamera() {
    if (!this.avatar) return;
    const cam = this.cameras.main;
    const zoom = Math.max(
      0.48,
      Math.min(this.scale.width / town.width, this.scale.height / town.height),
    );
    cam
      .setZoom(zoom)
      .setBounds(0, 0, town.width, town.height)
      .startFollow(this.avatar, true, 0.09, 0.09);
  }
  setPaused(value: boolean) {
    this.pausedInput = value;
    if (this.input?.keyboard) {
      this.input.keyboard.enabled = !value;
      if (value) this.input.keyboard.disableGlobalCapture();
      else this.input.keyboard.enableGlobalCapture();
    }
    if (value) {
      this.path = [];
      this.arrival = undefined;
      this.input?.keyboard?.resetKeys();
    }
  }
  sync(snapshot: Snapshot, neighbors: Neighbor[]) {
    const old = this.current;
    this.current = snapshot;
    if (!this.created) return;
    if (this.room !== snapshot.character.room) {
      this.children.removeAll(true);
      this.others.clear();
      this.bubble = undefined;
      this.path = [];
      this.arrival = undefined;
      this.obstacles = [];
      this.room = snapshot.character.room;
      this.lastNearby = null;
      this.callbacks.nearby(null);
      if (this.room === "town") this.drawTown();
      else
        this.drawHome(
          snapshot.homes.find((h) => `home:${h.id}` === this.room)?.name ??
            snapshot.character.name,
        );
      this.avatar = this.makeAvatar(
        snapshot.character.name,
        snapshot.character.color,
        true,
      );
      this.avatar.setPosition(snapshot.character.x, snapshot.character.y);
      this.resizeCamera();
    } else if (
      old?.character.name !== snapshot.character.name ||
      old?.character.color !== snapshot.character.color
    ) {
      const { x, y } = this.avatar;
      this.avatar.destroy();
      this.avatar = this.makeAvatar(
        snapshot.character.name,
        snapshot.character.color,
        true,
      ).setPosition(x, y);
      this.resizeCamera();
    }
    const active = neighbors.filter(
      (n) =>
        n.id !== snapshot.character.id &&
        n.room === this.room &&
        Date.now() - n.updatedAt < 45000,
    );
    for (const [id, item] of this.others)
      if (!active.some((n) => n.id === id)) {
        item.view.destroy();
        this.others.delete(id);
      }
    for (const n of active) {
      let item = this.others.get(n.id);
      if (
        item &&
        (item.target.name !== n.name || item.target.color !== n.color)
      ) {
        item.view.destroy();
        this.others.delete(n.id);
        item = undefined;
      }
      if (!item) {
        item = {
          view: this.makeAvatar(n.name, n.color, false).setPosition(n.x, n.y),
          target: n,
          stamp: 0,
        };
        this.others.set(n.id, item);
      }
      item.target = n;
      if (
        n.emote &&
        n.emoteAt &&
        n.emoteAt !== item.stamp &&
        Date.now() - n.emoteAt < 3000
      ) {
        item.stamp = n.emoteAt;
        const text = this.add
          .text(0, -100, n.emote, {
            fontSize: "28px",
            backgroundColor: "#fffdf4",
            padding: { x: 10, y: 8 },
          })
          .setOrigin(0.5);
        item.view.add(text);
        this.time.delayedCall(2500, () => text.destroy());
      }
    }
  }
  goTo(id: string) {
    if (this.room !== "town") return;
    const stop = stops.find((s) => s.id === id);
    if (!stop) return;
    this.arrival = id;
    this.path = this.findPath(stop.x, stop.y);
  }
  wave(value: string) {
    if (!this.avatar) return;
    this.bubble?.destroy();
    this.bubble = this.add
      .text(this.avatar.x, this.avatar.y - 95, value, {
        fontSize: "30px",
        backgroundColor: "#fffdf4",
        padding: { x: 10, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(9999);
    this.bubbleUntil = this.time.now + 2500;
  }
  update(time: number, delta: number) {
    if (!this.avatar) return;
    this.elapsed += delta;
    let dx = 0,
      dy = 0;
    if (!this.pausedInput) {
      dx =
        Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
        Number(this.keys.A.isDown || this.keys.LEFT.isDown);
      dy =
        Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
        Number(this.keys.W.isDown || this.keys.UP.isDown);
      if (dx || dy) {
        this.path = [];
        this.arrival = undefined;
      } else if (this.path.length) {
        const target = this.path[0],
          distance = Math.hypot(
            target.x - this.avatar.x,
            target.y - this.avatar.y,
          );
        if (distance < 7) this.path.shift();
        else {
          dx = (target.x - this.avatar.x) / distance;
          dy = (target.y - this.avatar.y) / distance;
        }
      }
    }
    const length = Math.hypot(dx, dy),
      speed = Math.min(delta, 50) * 0.24;
    if (length) {
      const x = this.avatar.x + (dx / length) * speed,
        y = this.avatar.y + (dy / length) * speed;
      if (this.walkable(x, this.avatar.y)) this.avatar.x = x;
      if (this.walkable(this.avatar.x, y)) this.avatar.y = y;
      const body = this.avatar.getAt(1) as Phaser.GameObjects.Graphics;
      body.y = Math.sin(time / 90) * 2.5;
    }
    this.avatar.setDepth(this.avatar.y + 1000);
    if (!this.path.length && this.arrival && !this.pausedInput) {
      const id = this.arrival;
      this.arrival = undefined;
      const stop = stops.find((s) => s.id === id)!;
      if (
        Phaser.Math.Distance.Between(
          this.avatar.x,
          this.avatar.y,
          stop.x,
          stop.y,
        ) < 150
      )
        this.callbacks.interact(id);
    }
    if (
      (this.wasMoving && !length) ||
      time - this.lastSend > (length ? 140 : 10000)
    ) {
      this.lastSend = time;
      this.callbacks.move(this.avatar.x, this.avatar.y);
    }
    this.wasMoving = Boolean(length);
    let nearby: string | null = null;
    if (this.room === "town")
      nearby =
        stops.find(
          (s) => Math.hypot(s.x - this.avatar.x, s.y - this.avatar.y) < 125,
        )?.id ?? null;
    else if (this.avatar.y > 745) nearby = "exit";
    if (nearby !== this.lastNearby) {
      this.lastNearby = nearby;
      this.callbacks.nearby(nearby);
    }
    for (const item of this.others.values()) {
      item.view.x = Phaser.Math.Linear(
        item.view.x,
        item.target.x,
        Math.min(1, delta / 120),
      );
      item.view.y = Phaser.Math.Linear(
        item.view.y,
        item.target.y,
        Math.min(1, delta / 120),
      );
      item.view.setDepth(item.view.y + 1000);
      if (Date.now() - item.target.updatedAt > 45000) {
        item.view.destroy();
        this.others.delete(item.target.id);
      }
    }
    if (this.bubble) {
      this.bubble.setPosition(this.avatar.x, this.avatar.y - 95);
      if (time > this.bubbleUntil) {
        this.bubble.destroy();
        this.bubble = undefined;
      }
    }
  }
  private walkable(x: number, y: number) {
    if (this.room !== "town")
      return (
        x > 335 &&
        x < 1105 &&
        y > 350 &&
        y < 845 &&
        !this.obstacles.some(
          (r) =>
            x > r.x - 12 &&
            x < r.x + r.w + 12 &&
            y > r.y - 8 &&
            y < r.y + r.h + 10,
        )
      );
    return (
      x > 35 &&
      x < town.width - 35 &&
      y > 110 &&
      y < town.height - 40 &&
      !this.obstacles.some(
        (r) =>
          x > r.x - 12 &&
          x < r.x + r.w + 12 &&
          y > r.y - 8 &&
          y < r.y + r.h + 10,
      )
    );
  }
  private findPath(x: number, y: number) {
    const size = 24,
      cols = Math.ceil(town.width / size),
      rows = Math.ceil(town.height / size);
    const point = (id: number) => ({
      x: (id % cols) * size + size / 2,
      y: Math.floor(id / cols) * size + size / 2,
    });
    const index = (px: number, py: number) =>
      Math.floor(py / size) * cols + Math.floor(px / size);
    let goal = index(
      Phaser.Math.Clamp(x, 36, town.width - 36),
      Phaser.Math.Clamp(y, 120, town.height - 36),
    );
    if (!this.walkable(point(goal).x, point(goal).y)) {
      let closest = Infinity;
      for (let id = 0; id < cols * rows; id++) {
        const p = point(id),
          d = Math.hypot(p.x - x, p.y - y);
        if (d < closest && this.walkable(p.x, p.y)) {
          closest = d;
          goal = id;
        }
      }
    }
    const start = index(this.avatar.x, this.avatar.y),
      queue = [start],
      parents = new Map<number, number>([[start, -1]]);
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      if (id === goal) break;
      for (const offset of [-1, 1, -cols, cols]) {
        const n = id + offset,
          p = point(n);
        if (
          n < 0 ||
          n >= cols * rows ||
          parents.has(n) ||
          Math.abs(p.x - point(id).x) > size ||
          !this.walkable(p.x, p.y)
        )
          continue;
        parents.set(n, id);
        queue.push(n);
      }
    }
    if (!parents.has(goal)) return [];
    const path = [];
    for (let id = goal; id !== start && id !== -1; id = parents.get(id)!)
      path.push(point(id));
    return path.reverse();
  }
  private text(
    x: number,
    y: number,
    value: string,
    size = 20,
    color = "#465c45",
  ) {
    return this.add
      .text(x, y, value, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: `${size}px`,
        color,
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);
  }
  private rect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    radius = 0,
  ) {
    const g = this.add.graphics();
    g.fillStyle(color);
    if (radius) g.fillRoundedRect(x, y, w, h, radius);
    else g.fillRect(x, y, w, h);
    return g;
  }
  private tree(x: number, y: number, scale = 1) {
    const g = this.add.graphics().setPosition(x, y).setScale(scale);
    g.fillStyle(0x5a855a, 0.13).fillEllipse(8, 16, 95, 28);
    g.fillStyle(0xa8855c).fillRoundedRect(-7, -15, 14, 39, 5);
    g.fillStyle(0x72a16e)
      .fillCircle(0, -33, 35)
      .fillCircle(-20, -22, 25)
      .fillCircle(21, -22, 25);
    g.fillStyle(0x8bb77c).fillCircle(-10, -44, 22).fillCircle(13, -43, 20);
    g.fillStyle(0xa9c88d, 0.8).fillCircle(-14, -49, 9);
  }
  private flower(x: number, y: number, color = 0xf5e8a8) {
    const g = this.add.graphics();
    g.lineStyle(2, 0x82a46c).lineBetween(x, y, x, y + 8);
    g.fillStyle(color)
      .fillCircle(x - 3, y, 3)
      .fillCircle(x + 3, y, 3)
      .fillCircle(x, y - 3, 3)
      .fillCircle(x, y + 3, 3);
    g.fillStyle(0xe2bc6d).fillCircle(x, y, 2);
  }
  private building(
    x: number,
    y: number,
    w: number,
    h: number,
    roof: number,
    wall: number,
    label: string,
    kind: string,
  ) {
    this.obstacles.push({ x, y: y + 35, w, h: h - 15 });
    const g = this.add.graphics();
    g.fillStyle(0x4f674a, 0.12).fillRoundedRect(x + 12, y + 25, w, h + 10, 14);
    g.fillStyle(wall).fillRoundedRect(x, y + 35, w, h - 15, 8);
    g.fillStyle(0xe6d9bc).fillRect(x, y + h + 4, w, 16);
    g.fillStyle(roof).fillTriangle(
      x - 18,
      y + 52,
      x + w / 2,
      y - 25,
      x + w + 18,
      y + 52,
    );
    g.fillRoundedRect(x - 18, y + 43, w + 36, 17, 5);
    g.lineStyle(3, 0xffffff, 0.12);
    for (let i = 0; i < 5; i++)
      g.lineBetween(x + (i * w) / 5, y + 42, x + w / 2, y - 20);
    g.fillStyle(0x926e51).fillRoundedRect(x + w / 2 - 22, y + h - 62, 44, 77, {
      tl: 20,
      tr: 20,
      bl: 0,
      br: 0,
    });
    g.fillStyle(0xbfe0db).fillRoundedRect(x + w / 2 - 15, y + h - 53, 30, 32, {
      tl: 14,
      tr: 14,
      bl: 0,
      br: 0,
    });
    g.fillStyle(0xf2d48e).fillCircle(x + w / 2 + 12, y + h - 10, 3);
    for (const wx of [x + 24, x + w - 70]) {
      g.fillStyle(0xfaf5e4).fillRoundedRect(wx - 5, y + 77, 54, 56, 7);
      g.fillStyle(0xaed2d5).fillRoundedRect(wx, y + 82, 44, 45, 4);
      g.lineStyle(3, 0xfaf5e4)
        .lineBetween(wx + 22, y + 82, wx + 22, y + 127)
        .lineBetween(wx, y + 104, wx + 44, y + 104);
      g.fillStyle(0xbd9870).fillRect(wx - 6, y + 132, 56, 10);
    }
    if (kind === "cafe" || kind === "restaurant") {
      for (let i = 0; i < 8; i++) {
        g.fillStyle(i % 2 ? 0xfff8e4 : 0xc88676).fillRoundedRect(
          x + 10 + (i * (w - 20)) / 8,
          y + 63,
          (w - 20) / 8,
          23,
          { tl: 0, tr: 0, bl: 8, br: 8 },
        );
      }
    }
    const sign = this.text(x + w / 2, y + h + 49, label, 21, "#56604c");
    sign.setBackgroundColor("#fffaec").setPadding(14, 8);
  }
  private drawTown() {
    this.cameras.main.setBackgroundColor("#b8cf95");
    this.rect(0, 0, town.width, town.height, 0xb8cf95);
    const random = new Phaser.Math.RandomDataGenerator(["willowbrook"]);
    for (let i = 0; i < 340; i++) {
      const x = random.between(20, 1420),
        y = random.between(110, 1010);
      const g = this.add.graphics();
      g.lineStyle(2, 0x9eba82, 0.6)
        .lineBetween(x, y, x - 3, y - 5)
        .lineBetween(x, y, x + 3, y - 4);
    }
    this.rect(0, 484, 1440, 123, 0xe8d9b6, 20);
    this.rect(652, 110, 137, 930, 0xe8d9b6, 24);
    this.rect(125, 790, 987, 86, 0xe8d9b6, 24);
    this.rect(125, 744, 70, 80, 0xe8d9b6);
    this.rect(298, 418, 70, 150, 0xe8d9b6);
    this.rect(1075, 425, 70, 120, 0xe8d9b6);
    this.rect(416, 730, 70, 90, 0xe8d9b6);
    this.rect(956, 730, 70, 100, 0xe8d9b6);
    const stones = this.add.graphics();
    stones.fillStyle(0xf4e9cf, 0.75);
    for (let x = 30; x < 1430; x += 56)
      stones.fillRoundedRect(x, 524 + (x % 3) * 10, 24, 9, 4);
    this.rect(601, 436, 239, 218, 0xf0e2c1, 70);
    // Garden pond and stepping stones.
    const pond = this.add.graphics();
    pond.fillStyle(0x91b57e).fillEllipse(920, 238, 210, 130);
    pond.fillStyle(0xd9dbac).fillEllipse(920, 231, 190, 120);
    pond.fillStyle(0x93c8cf).fillEllipse(920, 225, 170, 101);
    pond
      .lineStyle(3, 0xcce5db)
      .lineBetween(875, 215, 910, 215)
      .lineBetween(929, 245, 967, 245);
    pond.fillStyle(0x82aa79).fillEllipse(950, 205, 25, 13);
    this.flower(951, 203, 0xf5c1c5);
    this.obstacles.push({ x: 825, y: 165, w: 195, h: 120 });
    this.building(
      600,
      220,
      210,
      127,
      0xd5a052,
      0xffefca,
      restaurant.name,
      "restaurant",
    );
    this.text(705, 288, "RESTAURANT", 14, "#785734");
    this.building(222, 241, 220, 167, 0xbb7c68, 0xffefca, "Cloud Café", "cafe");
    this.building(
      1010,
      261,
      200,
      147,
      0x7e9f9f,
      0xf5eacb,
      "Little Post",
      "post",
    );
    this.building(
      350,
      638,
      200,
      127,
      0xa18cba,
      0xf7e8cc,
      "Your little home",
      "home",
    );
    this.building(
      890,
      638,
      200,
      127,
      0x799998,
      0xf8ebcb,
      "Neighbor homes",
      "home",
    );
    this.building(
      70,
      610,
      180,
      127,
      0x8c95bb,
      0xf5edd7,
      library.name,
      "library",
    );
    // Colorful books in the library windows.
    for (const wx of [96, 182]) {
      for (let i = 0; i < 4; i++) {
        this.rect(
          wx + i * 10,
          714 - (i % 2) * 5,
          7,
          18 + (i % 2) * 5,
          [0xbd7f70, 0x86a28a, 0xd3ad60, 0x929bc1][i],
          1,
        );
      }
    }
    // Café terrace.
    const terrace = this.add.graphics();
    terrace.fillStyle(0xd7c9a5).fillRoundedRect(108, 398, 100, 74, 14);
    terrace.fillStyle(0xf6ebd2).fillCircle(154, 424, 26);
    terrace
      .fillStyle(0x94765c)
      .fillRoundedRect(119, 419, 12, 22, 3)
      .fillRoundedRect(179, 419, 12, 22, 3);
    terrace.fillStyle(0xc18570).fillCircle(153, 421, 7);
    // Fountain at the heart of the square.
    const f = this.add.graphics();
    f.fillStyle(0x72816c, 0.12).fillEllipse(725, 547, 123, 69);
    f.fillStyle(0xc5c7b3).fillEllipse(720, 531, 110, 67);
    f.fillStyle(0xf4eedb).fillEllipse(720, 521, 110, 63);
    f.fillStyle(0x9bced1).fillEllipse(720, 517, 90, 43);
    f.fillStyle(0xd4d7c4).fillRoundedRect(712, 469, 16, 49, 6);
    f.fillStyle(0xf7f0d9).fillEllipse(720, 476, 49, 17);
    f.fillStyle(0xb2d9d6).fillEllipse(720, 472, 38, 10);
    f.fillStyle(0xeaf5e3).fillCircle(720, 452, 6);
    this.obstacles.push({ x: 667, y: 474, w: 106, h: 60 });
    this.text(720, 146, "W I L L O W B R O O K", 24, "#5b7855");
    this.text(720, 182, "a little place for us", 17, "#708563");
    for (const [x, y, s] of [
      [82, 230, 1.5],
      [1280, 231, 1.4],
      [550, 269, 1.25],
      [48, 917, 1.0],
      [1240, 725, 1.35],
      [179, 887, 1.25],
      [575, 935, 1.15],
      [852, 936, 1.2],
      [1310, 925, 1.6],
      [112, 110, 1.1],
      [1350, 455, 1.1],
      [554, 419, 0.9],
      [1210, 117, 0.9],
    ])
      this.tree(x, y, s);
    for (let i = 0; i < 65; i++) {
      const x = random.between(40, 1400),
        y = random.between(120, 1000);
      if (this.walkable(x, y) && !(y > 480 && y < 610) && !(x > 640 && x < 805))
        this.flower(x, y, i % 3 ? 0xfff1b4 : 0xf1bed0);
    }
    this.text(720, 935, "✿  Make yourself at home  ✿", 18, "#6b875e");
    this.rect(1154, 424, 25, 40, 0x6e9494, 5);
    this.rect(1150, 421, 33, 21, 0x86a9a3, 8);
    this.rect(1160, 426, 14, 4, 0xe5eee0, 2);
    // A friendly trail marker.
    this.rect(590, 635, 7, 51, 0xaa8c63, 2);
    this.rect(551, 623, 85, 28, 0xfff1cb, 5);
    this.text(593, 637, "HOME ↓", 13, "#7c795c");
  }
  private drawHome(name: string) {
    this.cameras.main.setBackgroundColor("#b7c9a2");
    this.rect(0, 0, 1440, 1040, 0xb7c9a2);
    this.rect(295, 185, 860, 710, 0x80916e, 25);
    this.rect(315, 170, 810, 700, 0xf8ecd4, 18);
    this.rect(335, 200, 770, 180, 0xd9dfc3, 8);
    this.rect(335, 380, 770, 465, 0xdfbd96);
    const g = this.add.graphics();
    g.lineStyle(2, 0xc9a880, 0.6);
    for (let y = 410; y < 845; y += 38) g.lineBetween(335, y, 1105, y);
    this.rect(610, 490, 230, 200, 0xd9a795, 30);
    this.rect(626, 506, 198, 168, 0xe8c1aa, 24);
    this.rect(377, 394, 177, 95, 0x85a89a, 18);
    this.rect(387, 381, 157, 64, 0xa0b9a4, 15);
    this.rect(370, 420, 28, 72, 0x729484, 10);
    this.rect(535, 420, 28, 72, 0x729484, 10);
    this.rect(911, 375, 144, 210, 0xa08063, 8);
    this.rect(920, 382, 126, 190, 0xf4e8ce, 9);
    this.rect(920, 435, 126, 137, 0xb5abc6, 10);
    this.rect(933, 391, 98, 39, 0xfff7e4, 12);
    this.rect(885, 671, 181, 86, 0xb29069, 12);
    this.rect(893, 661, 164, 71, 0xd8b58a, 12);
    this.rect(460, 240, 94, 88, 0xfff8e6, 8);
    this.rect(468, 248, 78, 72, 0xb2d7d9, 4);
    this.rect(503, 248, 5, 72, 0xfff8e6);
    this.rect(468, 281, 78, 5, 0xfff8e6);
    this.rect(842, 238, 92, 72, 0xae8d66, 5);
    this.rect(851, 247, 74, 54, 0xf2d5a2, 3);
    this.text(888, 274, "✿", 36, "#a18b73");
    this.tree(1035, 322, 0.6);
    this.text(720, 121, `${name}’s home`, 28, "#486048");
    this.text(720, 912, "A cozy corner of your own.", 20, "#60775a");
    this.rect(659, 813, 122, 34, 0xf3dfb6, 5);
    this.text(720, 830, "TOWN ↓", 16, "#8f7857");
    this.obstacles.push(
      { x: 370, y: 380, w: 193, h: 110 },
      { x: 911, y: 375, w: 144, h: 210 },
      { x: 885, y: 661, w: 181, h: 96 },
    );
  }
  private makeAvatar(name: string, color: string, own: boolean) {
    const container = this.add.container(0, 0);
    const shadow = this.add
      .graphics()
      .fillStyle(0x526445, 0.22)
      .fillEllipse(0, 5, 38, 13);
    const g = this.add.graphics();
    g.fillStyle(0x635647)
      .fillRoundedRect(-12, -9, 10, 15, 4)
      .fillRoundedRect(3, -9, 10, 15, 4);
    g.fillStyle(
      Phaser.Display.Color.HexStringToColor(color).color,
    ).fillRoundedRect(-18, -39, 36, 35, 12);
    g.fillStyle(0xf0c9a0)
      .fillCircle(-20, -22, 6)
      .fillCircle(20, -22, 6)
      .fillCircle(0, -54, 21);
    g.fillStyle(0x665145)
      .fillRoundedRect(-22, -75, 43, 22, { tl: 18, tr: 18, bl: 3, br: 3 })
      .fillCircle(-18, -56, 6);
    g.fillStyle(0x574b3f).fillCircle(-7, -53, 2).fillCircle(7, -53, 2);
    g.lineStyle(2, 0xc28c75)
      .beginPath()
      .arc(0, -48, 5, 0, Math.PI, false)
      .strokePath();
    const label = this.add
      .text(0, 27, `${name}${own ? " · you" : ""}`, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "16px",
        color: "#4f5f4b",
        backgroundColor: "#fff9eb",
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5);
    container.add([shadow, g, label]);
    return container;
  }
}
