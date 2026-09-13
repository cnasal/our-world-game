import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { TownScene } from "./TownScene";
import type { GameBridge } from "../types";
export function GameCanvas({
  bridge,
  paused,
  onNearby,
  onInteract,
  sceneRef,
}: {
  bridge: GameBridge;
  paused: boolean;
  onNearby: (id: string | null) => void;
  onInteract: (id: string) => void;
  sceneRef: React.RefObject<TownScene | null>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ bridge, onNearby, onInteract });
  latest.current = { bridge, onNearby, onInteract };
  useEffect(() => {
    const scene = new TownScene({
      move: (x, y) => latest.current.bridge.move(x, y),
      nearby: (id) => latest.current.onNearby(id),
      interact: (id) => latest.current.onInteract(id),
      initial: () => latest.current.bridge,
    });
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current!,
      backgroundColor: "#b8cf95",
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: host.current!.clientWidth,
        height: host.current!.clientHeight,
      },
      scene,
      render: { antialias: true, roundPixels: false },
      input: { activePointers: 2 },
      audio: { noAudio: true },
    });
    const resize = new ResizeObserver(() => {
      if (host.current)
        game.scale.resize(host.current.clientWidth, host.current.clientHeight);
    });
    resize.observe(host.current!);
    return () => {
      resize.disconnect();
      sceneRef.current = null;
      game.destroy(true);
    };
  }, [sceneRef]);
  useEffect(() => {
    sceneRef.current?.sync(bridge.snapshot, bridge.neighbors);
  }, [bridge.snapshot, bridge.neighbors, sceneRef]);
  useEffect(() => {
    sceneRef.current?.setPaused(paused);
  }, [paused, sceneRef]);
  return (
    <div
      ref={host}
      className="game-canvas"
      role="img"
      aria-label="Interactive town. Use arrow keys or tap a path to walk. Use the Places buttons to walk to a building."
    />
  );
}
