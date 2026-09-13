export type Character = {
  id: string;
  name: string;
  color: string;
  balance: number;
  room: string;
  x: number;
  y: number;
  inventory: Record<string, number>;
  delivery: "none" | "carrying";
  deliveries: number;
};
export type Neighbor = {
  id: string;
  name: string;
  color: string;
  room: string;
  x: number;
  y: number;
  updatedAt: number;
  emote?: string;
  emoteAt?: number;
};
export type Receipt = { id: string; label: string; amount: number; at: number };
export type Snapshot = {
  worldId: string;
  worldName: string;
  character: Character;
  homes: { id: string; name: string; color: string }[];
  receipts: Receipt[];
};
export type GameAction =
  | { type: "profile"; name: string; color: string }
  | { type: "buy"; itemId: string; requestId: string }
  | { type: "use"; itemId: string; requestId: string }
  | { type: "startJob" }
  | { type: "finishJob"; requestId: string }
  | { type: "room"; room: string };
export type GameBridge = {
  snapshot: Snapshot;
  neighbors: Neighbor[];
  act: (action: GameAction) => Promise<void>;
  move: (x: number, y: number) => void;
  emote: (value: string) => void;
  mode: "preview" | "live";
  connected: boolean;
};
