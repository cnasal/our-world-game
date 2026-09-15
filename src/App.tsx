import { gardenShop, seeds } from "./content/garden";
import { resaleShop, resalePrice } from "./content/resale";
import { homeItemSpots } from "./content/homeItems";
import { bank } from "./content/bank";
import { defaultHomeStyle, wallColors, floorColors } from "./content/homes";
import { iceCreamShop, iceCreams } from "./content/iceCream";
import { shelter, pets, petFor } from "./content/pets";
import { toyStore, toys } from "./content/toys";
import { UpdateNotice } from "./UpdateNotice";
import { shopFor, shopInteriors, shopCounter } from "./content/interiors";
import { deliveryPlaces } from "./content/deliveries";
import {
  hotel,
  hotelMeals,
  hotelRoomName,
  hotelStops,
  isHotelRoom,
} from "./content/hotel";
import { furnitureFor } from "./content/furniture";
import { school, schoolStations } from "./content/school";
import { School } from "./School";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SignInButton, UserButton, useUser } from "@clerk/react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useConvexConnectionState,
  useMutation,
  useQuery,
} from "convex/react";
import type { GenericId } from "convex/values";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  Backpack,
  GraduationCap,
  Hotel,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Coins,
  Coffee,
  Heart,
  Home,
  Leaf,
  MapPin,
  Package,
  Pencil,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Users,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { api } from "./api";
import {
  avatarColors,
  drinks,
  meals,
  restaurant,
  shopItems,
  stops,
  town,
} from "./content/town";
import { books, library } from "./content/library";
import { GameCanvas } from "./game/GameCanvas";
import type { TownScene } from "./game/TownScene";
import { usePreview } from "./preview";
import type { GameAction, GameBridge } from "./types";
const displayError = (error: unknown) =>
  error instanceof Error
    ? error.message
        .replace(/\[CONVEX[^\]]*\]\s*/g, "")
        .replace(/Uncaught Error: /g, "")
        .split("\n")[0]
    : "Something went wrong. Please try again.";

export default function App() {
  return (
    <ErrorBoundary>
      <UpdateNotice />
      <Unauthenticated>
        <Welcome />
      </Unauthenticated>
      <AuthLoading>
        <Loading />
      </AuthLoading>
      <Authenticated>
        <WorldPicker />
      </Authenticated>
    </ErrorBoundary>
  );
}
export function PreviewApp() {
  const bridge = usePreview();
  return (
    <>
      {" "}
      <UpdateNotice />
      <GameShell bridge={bridge} />
    </>
  );
}
function Loading() {
  return (
    <div className="loading">
      <div className="loading-leaf">
        <Sprout size={36} />
      </div>
      <h2>Opening the garden gate…</h2>
      <p>Your little world is on its way.</p>
    </div>
  );
}
function BuildVersion() {
  const builtAt = import.meta.env.VITE_BUILD_TIME as string;
  return (
    <time
      className="build-version"
      dateTime={builtAt}
      title="When this version was built (UTC)"
    >
      {import.meta.env.DEV ? "Dev · " : ""}Built{" "}
      {builtAt.replace("T", " ").slice(0, 19)} UTC
    </time>
  );
}
function Brand() {
  return (
    <a className="brand" href="/" aria-label="Our World home">
      <span className="brand-icon">
        <Sprout size={26} />
      </span>
      <span>
        our world<span className="brand-dot">.</span>
        <small>A LITTLE PLACE FOR US</small>
      </span>
    </a>
  );
}
function Welcome() {
  return (
    <div className="welcome">
      <header>
        <Brand />
        <span className="private-label">
          <ShieldCheck size={15} /> Our private corner of the world
        </span>
      </header>
      <main className="welcome-main">
        <div className="welcome-copy">
          <span className="eyebrow">
            <Sun size={17} /> A LITTLE EVERYDAY MAGIC
          </span>
          <h1>
            A small town.
            <br />A whole lot of <em>us.</em>
          </h1>
          <p>
            Make a home, follow a little adventure, and find each other along
            the way. Welcome to a world we get to grow together.
          </p>
          <SignInButton mode="modal">
            <button className="primary large">
              Open the garden gate <ArrowRight size={19} />
            </button>
          </SignInButton>
          <span className="welcome-note">
            <ShieldCheck size={14} /> Just for our family and invited neighbors.
          </span>
          {import.meta.env.DEV && (
            <a className="preview-link" href="?preview">
              Explore the local preview <ArrowRight size={14} />
            </a>
          )}
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-cloud one" />
          <div className="art-cloud two" />
          <div className="art-hill back" />
          <div className="art-hill front" />
          <div className="art-house">
            <div className="art-roof" />
            <div className="art-window" />
            <div className="art-door" />
          </div>
          <div className="art-tree t1" />
          <div className="art-tree t2" />
          <div className="art-path" />
          <div className="art-flower f1">✿</div>
          <div className="art-flower f2">✿</div>
          <span className="art-label">
            <Heart size={15} /> There’s a place for you here.
          </span>
        </div>
      </main>
      <footer>
        Little adventures. Big imaginations. Made together. <BuildVersion />
      </footer>
    </div>
  );
}
function WorldPicker() {
  const worlds = useQuery(api.worlds);
  const { user } = useUser();
  const [choice, setChoice] = useState<string>();
  if (worlds === undefined) return <Loading />;
  if (!worlds.length)
    return (
      <div className="setup">
        <Sprout size={40} />
        <h1>Your invitation is growing.</h1>
        <p>
          You’re signed in. The world owner needs to add your account before you
          can enter.
        </p>
        <p className="small">Your account ID</p>
        <code>{user?.id}</code>
        <div className="setup-actions">
          <UserButton />
          <button className="secondary" onClick={() => location.reload()}>
            Check again
          </button>
        </div>
      </div>
    );
  const selected =
    worlds.find((w) => w.id === choice) ??
    (worlds.length === 1 ? worlds[0] : undefined);
  if (!selected)
    return (
      <div className="setup">
        <h1>Where shall we go?</h1>
        {worlds.map((w) => (
          <button
            className="primary"
            key={w.id}
            onClick={() => setChoice(w.id)}
          >
            {w.name}
            <ArrowRight size={18} />
          </button>
        ))}
      </div>
    );
  return (
    <LiveWorld key={selected.id} worldId={selected.id as GenericId<"worlds">} />
  );
}
function LiveWorld({ worldId }: { worldId: GenericId<"worlds"> }) {
  const saved = useQuery(api.snapshot, { worldId });
  const [room, setRoom] = useState("town");
  const neighbors = useQuery(api.people, { worldId, room });
  const moveMutation = useMutation(api.move),
    enter = useMutation(api.enter),
    profile = useMutation(api.profile),
    decorate = useMutation(api.decorate),
    transact = useMutation(api.transact),
    rest = useMutation(api.rest),
    emote = useMutation(api.emote);
  const connection = useConvexConnectionState();
  const [ready, setReady] = useState(false),
    [networkError, setNetworkError] = useState("");
  const pos = useRef({ ...town.spawn });
  const posture = useRef<string | null>(null);
  const ownPresence = neighbors?.find(
    (person) => person.id === saved?.character.id,
  );
  posture.current = ownPresence?.restId ?? null;
  const acting = useRef(false);
  const pending = useRef<Promise<unknown> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    void enter({ worldId, room: "town" })
      .then(() => {
        if (mounted.current) setReady(true);
      })
      .catch((e) => setNetworkError(displayError(e)));
    return () => {
      mounted.current = false;
    };
  }, [enter, worldId]);
  const move = useCallback(
    (x: number, y: number) => {
      if (acting.current) return;
      pos.current = { x, y };
      if (!connection.isWebSocketConnected || pending.current) return;
      pending.current = moveMutation({ worldId, x, y, restId: posture.current })
        .catch((e) => setNetworkError(displayError(e)))
        .finally(() => {
          pending.current = null;
        });
    },
    [connection.isWebSocketConnected, moveMutation, worldId],
  );
  const act = useCallback(
    async (action: GameAction) => {
      if (!connection.isWebSocketConnected)
        throw new Error(
          "Reconnecting. Please wait a moment before making changes.",
        );
      acting.current = true;
      try {
        await pending.current;
        if (action.type === "room") {
          await enter({ worldId, room: action.room });
          pos.current = { ...town.spawn };
          posture.current = null;
          setRoom(action.room);
        } else if (action.type === "rest") {
          await moveMutation({
            worldId,
            ...pos.current,
            restId: posture.current,
          });
          const value = await rest({
            worldId,
            furnitureId: action.furnitureId,
          });
          pos.current = { x: value.x, y: value.y };
          posture.current = value.restId ?? null;
        } else if (action.type === "decorate")
          await decorate({
            worldId,
            wallColor: action.wallColor,
            floorColor: action.floorColor,
          });
        else if (action.type === "profile")
          await profile({ worldId, name: action.name, color: action.color });
        else {
          await moveMutation({
            worldId,
            ...pos.current,
            restId: posture.current,
          });
          await transact({
            worldId,
            type: action.type,
            coins: "coins" in action ? action.coins : undefined,
            spotId: "spotId" in action ? action.spotId : undefined,
            itemId: "itemId" in action ? action.itemId : undefined,
            destination:
              action.type === "startJob" ? action.destination : undefined,
            requestId:
              ("requestId" in action ? action.requestId : undefined) ??
              crypto.randomUUID(),
          });
        }
      } finally {
        acting.current = false;
      }
    },
    [
      connection.isWebSocketConnected,
      enter,
      moveMutation,
      profile,
      decorate,
      transact,
      rest,
      worldId,
    ],
  );
  if (networkError && !ready)
    return (
      <div className="setup">
        <h1>We couldn’t open the gate.</h1>
        <p>{networkError}</p>
        <button className="primary" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  if (!saved || !neighbors || !ready) return <Loading />;
  const snapshot = {
    ...saved,
    character: {
      ...saved.character,
      room,
      x: ownPresence?.x ?? town.spawn.x,
      y: ownPresence?.y ?? town.spawn.y,
      restId: ownPresence?.restId,
    },
  };
  const bridge: GameBridge = {
    snapshot,
    neighbors,
    act,
    move,
    emote: (value) => {
      void emote({ worldId, value }).catch((e) =>
        setNetworkError(displayError(e)),
      );
    },
    mode: "live",
    connected: connection.isWebSocketConnected,
  };
  return (
    <>
      <GameShell bridge={bridge} />
      {networkError && (
        <button className="network-notice" onClick={() => setNetworkError("")}>
          {networkError} · Dismiss
        </button>
      )}
    </>
  );
}

type Panel =
  | "garden"
  | "resale"
  | "homeItems"
  | "decorate"
  | "profile"
  | "bag"
  | "bank"
  | "cafe"
  | "icecream"
  | "shelter"
  | "toys"
  | "restaurant"
  | "library"
  | "school"
  | "hotelDining"
  | "post"
  | "neighbors"
  | "help"
  | null;
function GameShell({ bridge }: { bridge: GameBridge }) {
  const {
    snapshot: { character: c, homes, worldName, receipts },
    mode,
  } = bridge;
  const [panel, setPanel] = useState<Panel>(null),
    [nearby, setNearby] = useState<string | null>(null),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false);
  const scene = useRef<TownScene | null>(null);
  const [schoolLesson, setSchoolLesson] = useState<string | null>(null);
  const lock = useRef(false);
  const [deliveryChoice, setDeliveryChoice] = useState("cafe");
  const [name, setName] = useState(c.name),
    [color, setColor] = useState(c.color);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameArea = useRef<HTMLDivElement>(null);
  const notify = (text: string) => setToast(text);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const listener = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, []);
  const perform = async (
    action: GameAction,
    message?: string,
    close = false,
  ) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await bridge.act(action);
      if (message) notify(message);
      if (close) setPanel(null);
    } catch (e) {
      notify(displayError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const [unpackSpot, setUnpackSpot] = useState("");
  const placedItems = homes.find((home) => home.id === c.id)?.homeItems ?? {};
  const freeSpots = homeItemSpots.filter((spot) => !placedItems[spot.id]);
  const selectedSpot =
    freeSpots.find((spot) => spot.id === unpackSpot)?.id ?? freeSpots[0]?.id;
  const [bankAmount, setBankAmount] = useState("10");
  const coinsToMove = Number(bankAmount);
  const validCoins = Number.isSafeInteger(coinsToMove) && coinsToMove > 0;
  const [homeStyle, setHomeStyle] = useState(defaultHomeStyle);
  const open = (value: Panel) => {
    if (value === "decorate")
      setHomeStyle(
        homes.find((home) => home.id === c.id)?.homeStyle ?? defaultHomeStyle,
      );
    if (value === "profile") {
      setName(c.name);
      setColor(c.color);
    }
    setPanel(value);
  };
  const interact = (id: string) => {
    if (id === "home-items") open("homeItems");
    else if (id === "stand") void perform({ type: "rest", furnitureId: null });
    else if (id.startsWith("rest:"))
      void perform({ type: "rest", furnitureId: id.slice(5) });
    else if (id === "shop-counter" && shopFor(c.room))
      open(shopFor(c.room)!.id as Panel);
    else if (shopInteriors.some((shop) => shop.id === id))
      void perform({
        type: "room",
        room: shopInteriors.find((shop) => shop.id === id)!.room,
      });
    else if (id === "home")
      void perform({ type: "room", room: `home:${c.id}` }, "Welcome home!");
    else if (id === "hotel")
      void perform(
        { type: "room", room: hotel.lobby },
        "Welcome to The Nasal Hotel!",
      );
    else if (id === "hotel-buffet" && c.room === hotel.dining)
      open("hotelDining");
    else if (id.startsWith("door:") && isHotelRoom(c.room)) {
      const door = hotelStops(c.room).find((entry) => entry.id === id);
      if (door?.target) void perform({ type: "room", room: door.target });
    } else if (id === "school")
      void perform(
        { type: "room", room: "school" },
        "Welcome to school! Walk up to a subject desk.",
      );
    else if (id.startsWith("lesson:") && c.room === "school") {
      const station = schoolStations.find((entry) => entry.id === id);
      if (station) {
        setSchoolLesson(station.lessonId);
        open("school");
      }
    } else if (id === "exit")
      void perform({
        type: "room",
        room:
          hotelStops(c.room).find((entry) => entry.id === "exit")?.target ??
          "town",
      });
    else if (["neighbors"].includes(id)) open(id as Panel);
  };
  const go = async (id: string) => {
    const destination = shopInteriors.find((shop) => shop.id === id);
    if (destination && c.room === destination.room) {
      scene.current?.goTo(shopCounter.id);
      return;
    }
    if (
      c.room !== "town" &&
      (destination || id === "school" || id === "hotel")
    ) {
      await perform({
        type: "room",
        room: destination?.room ?? (id === "hotel" ? hotel.lobby : "school"),
      });
      return;
    }
    if (isHotelRoom(c.room) && id === "hotel") {
      if (c.room !== hotel.lobby)
        await perform({ type: "room", room: hotel.lobby });
      else notify("Choose a door to explore the hotel.");
      return;
    }
    if (c.room === "school" && id === "school") {
      notify("Choose a subject desk to walk to.");
      return;
    }
    if (c.room !== "town") {
      await perform({ type: "room", room: "town" });
      notify("You’re back in town. Choose a place to walk to.");
    } else {
      scene.current?.goTo(id);
      notify(
        `On our way to ${stops.find((s) => s.id === id)?.name ?? "town"}…`,
      );
    }
  };
  const destinations = deliveryPlaces(homes);
  const parcel = destinations.find(
    (place) => place.id === (c.deliveryTarget ?? "cafe"),
  );
  const selectedDelivery =
    destinations.find((place) => place.id === deliveryChoice) ??
    destinations[0];
  const canDeliver =
    c.delivery === "carrying" &&
    parcel &&
    (parcel.room === c.room ||
      (parcel.outside && c.room === "town" && nearby === parcel.stopId));
  const deliver = (
    <div className="handoff">
      <Package size={23} />
      <div>
        <strong>A parcel for {parcel?.name}</strong>
        <small>Thank you for bringing it!</small>
      </div>
      <button
        className="primary"
        disabled={busy}
        onClick={() =>
          void perform(
            { type: "finishJob", requestId: crypto.randomUUID() },
            "Delivery complete! You earned 15 coins.",
          )
        }
      >
        Deliver · +15
      </button>
    </div>
  );
  const goDelivery = () => {
    if (parcel?.stopId) void go(parcel.stopId);
    else if (parcel?.room) void perform({ type: "room", room: parcel.room });
  };
  const title = {
    garden: gardenShop.name,
    resale: resaleShop.name,
    homeItems: "Things in your home",
    decorate: "Make your home your own",
    profile: "A little more you",
    bag: "Your little collection",
    bank: bank.name,
    cafe: "Something lovely to sip",
    icecream: iceCreamShop.name,
    shelter: shelter.name,
    toys: toyStore.name,
    restaurant: restaurant.name,
    library: library.name,
    school: school.name,
    hotelDining: "Help yourself!",
    post: "A little job. A big help.",
    neighbors: "A neighborhood of friends",
    help: "Make yourself at home",
  };
  const companion = petFor(c.petId);
  const count = Object.values(c.inventory).reduce((sum, n) => sum + n, 0);
  const online = bridge.neighbors.filter(
    (n) => n.id !== c.id && Date.now() - n.updatedAt < 45000,
  );
  const isHome = c.room.startsWith("home:");
  const isSchool = c.room === "school";
  const shop = shopFor(c.room);
  const inHotel = isHotelRoom(c.room);
  const exitName =
    inHotel && c.room !== hotel.lobby ? "Back to lobby" : "Back to town";
  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <nav className="top-nav" aria-label="Main">
          <button
            className={c.room === "town" ? "nav-active" : ""}
            onClick={() => {
              if (c.room !== "town")
                void perform({ type: "room", room: "town" });
            }}
          >
            <MapPin size={17} /> Our town
          </button>
          <button
            className={isHome ? "nav-active" : ""}
            onClick={() =>
              void perform(
                { type: "room", room: `home:${c.id}` },
                "Welcome home!",
              )
            }
          >
            <Home size={17} /> My home
          </button>
          <button onClick={() => open("neighbors")}>
            <Users size={17} /> Neighbors
          </button>
        </nav>
        <div className="header-right">
          <span className="private-label">
            <ShieldCheck size={14} /> Private world
          </span>
          {mode === "live" ? (
            <UserButton />
          ) : (
            <span className="preview-pill">Local preview</span>
          )}
        </div>
      </header>
      <main className="main-layout">
        <section className="play-column">
          <div className="town-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-dot" /> YOUR SHARED LITTLE WORLD
              </div>
              <h1>
                {isHome
                  ? `${homes.find((h) => `home:${h.id}` === c.room)?.name ?? c.name}’s home`
                  : isSchool
                    ? school.name
                    : shop
                      ? shop.name
                      : inHotel
                        ? hotelRoomName(c.room)
                        : worldName}
                <span className="heading-flower">✳</span>
              </h1>
              <p>
                {isHome
                  ? "Come in, get cozy, stay a little while."
                  : isSchool
                    ? "Walk to a desk and discover something new."
                    : shop
                      ? `Come inside and ${shop.action.toLowerCase()}.`
                      : inHotel
                        ? "A cozy stay, a new room, and something yummy."
                        : "A lovely day for a little adventure."}
              </p>
            </div>
            <div className="weather">
              <Sun size={26} />
              <div>
                A little sunshine<small>Take your time. You’re home.</small>
              </div>
            </div>
          </div>
          <div className="game-frame" ref={gameArea}>
            <GameCanvas
              bridge={bridge}
              paused={panel !== null || busy || !bridge.connected}
              onNearby={setNearby}
              onInteract={interact}
              sceneRef={scene}
            />
            <div className="map-top">
              <span className="map-location">
                <MapPin size={14} />
                {isHome
                  ? "Cozy at home"
                  : isSchool
                    ? "Inside the school"
                    : shop
                      ? shop.name
                      : inHotel
                        ? "Inside the hotel"
                        : "Willowbrook square"}
              </span>
              <span
                className={"connection " + (!bridge.connected ? "offline" : "")}
              >
                <span />
                {!bridge.connected
                  ? "Reconnecting…"
                  : mode === "preview"
                    ? "Solo preview"
                    : `${online.length + 1} here`}
              </span>
            </div>
            {c.room !== "town" && (
              <button className="back-town" onClick={() => interact("exit")}>
                <ArrowLeft size={16} /> {exitName}
              </button>
            )}
            <div className="map-bottom">
              <div className="emote-tray" aria-label="Say hello">
                {["👋", "❤️", "✨", "😊"].map((e, i) => (
                  <button
                    key={e}
                    aria-label={["Wave", "Send a heart", "Sparkle", "Smile"][i]}
                    onClick={() => {
                      bridge.emote(e);
                      scene.current?.wave(e);
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
              {nearby && (
                <button
                  className="interact-button"
                  onClick={() => interact(nearby)}
                >
                  {nearby === "garden"
                    ? "Visit garden shop"
                    : nearby === "resale"
                      ? "Visit resale shop"
                      : nearby === "bank"
                        ? "Visit bank"
                        : nearby === "icecream"
                          ? "Visit ice cream shop"
                          : nearby === "shelter"
                            ? "Visit animal shelter"
                            : nearby === "toys"
                              ? "Visit toy store"
                              : nearby === "shop-counter"
                                ? shop?.action
                                : nearby === "stand"
                                  ? "Stand up"
                                  : nearby.startsWith("rest:")
                                    ? furnitureFor(c.room).find(
                                        (item) => item.id === nearby.slice(5),
                                      )?.pose === "lie"
                                      ? "Lie on bed"
                                      : "Sit down"
                                    : nearby.startsWith("lesson:")
                                      ? `Try ${schoolStations.find((entry) => entry.id === nearby)?.name ?? "a lesson"}`
                                      : nearby === "exit"
                                        ? exitName
                                        : nearby === "hotel"
                                          ? "Enter hotel"
                                          : nearby === "hotel-buffet"
                                            ? "Free buffet"
                                            : nearby.startsWith("door:")
                                              ? `Enter ${hotelStops(c.room).find((entry) => entry.id === nearby)?.name ?? "room"}`
                                              : nearby === "cafe"
                                                ? "Visit café"
                                                : nearby === "restaurant"
                                                  ? "Visit restaurant"
                                                  : nearby === "library"
                                                    ? "Visit library"
                                                    : nearby === "school"
                                                      ? "Visit school"
                                                      : nearby === "post"
                                                        ? "Pick up a job"
                                                        : nearby === "home"
                                                          ? "Go inside"
                                                          : "Visit a neighbor"}{" "}
                  <span>E</span>
                </button>
              )}
              <button
                className="map-help"
                aria-label="How to play"
                onClick={() => open("help")}
              >
                <CircleHelp size={20} />
              </button>
            </div>
          </div>
          {shop && (
            <nav className="school-desks" aria-label="Shop counter">
              <button
                className="secondary"
                onClick={() => scene.current?.goTo(shopCounter.id)}
              >
                {shop.action}
              </button>
            </nav>
          )}
          {c.room === `home:${c.id}` && (
            <nav className="school-desks" aria-label="Your home">
              <button className="secondary" onClick={() => open("decorate")}>
                <Home size={17} /> Decorate my home
              </button>
              <button className="secondary" onClick={() => open("homeItems")}>
                Pick up items
              </button>
            </nav>
          )}
          {isSchool && (
            <nav className="school-desks" aria-label="Classroom desks">
              {schoolStations.map((station) => (
                <button
                  className="secondary"
                  key={station.id}
                  onClick={() => scene.current?.goTo(station.id)}
                >
                  {station.name}
                </button>
              ))}
            </nav>
          )}
          {inHotel && (
            <nav className="school-desks" aria-label="Hotel rooms">
              {hotelStops(c.room)
                .filter((entry) => entry.id !== "exit")
                .map((entry) => (
                  <button
                    className="secondary"
                    key={entry.id}
                    onClick={() => scene.current?.goTo(entry.id)}
                  >
                    {entry.name}
                  </button>
                ))}
              {c.room === hotel.dining && (
                <button className="primary" onClick={() => open("hotelDining")}>
                  Free menu
                </button>
              )}
            </nav>
          )}
          <nav className="furniture-actions" aria-label="Places to rest">
            {c.restId ? (
              <button
                className="secondary"
                onClick={() => interact("stand")}
                disabled={busy}
              >
                Stand up
              </button>
            ) : (
              furnitureFor(c.room).map((item) => (
                <button
                  className="secondary"
                  key={item.id}
                  onClick={() => scene.current?.goTo(`rest:${item.id}`)}
                  disabled={busy}
                >
                  {item.pose === "lie" ? "Lie on" : "Sit on"}{" "}
                  {item.name.toLowerCase()}
                </button>
              ))
            )}
          </nav>
          <div className="map-caption">
            <span>
              <span className="key-cap">↑</span>
              <span className="key-cap">←</span>
              <span className="key-cap">↓</span>
              <span className="key-cap">→</span> to wander{" "}
              <span className="caption-divider">·</span> or tap where you’d like
              to go
            </span>
            <button
              onClick={() => {
                if (!document.fullscreenEnabled) {
                  notify("For a bigger view, turn your device sideways.");
                  return;
                }
                void (
                  isFullscreen
                    ? document.exitFullscreen()
                    : gameArea.current!.requestFullscreen()
                ).catch(() =>
                  notify("Try turning your device sideways for a bigger view."),
                );
              }}
            >
              <Settings2 size={15} />{" "}
              {isFullscreen ? "Smaller view" : "Bigger view"}
            </button>
          </div>
          <div className="bottom-note">
            <span>✿</span> There’s no rush here. Good things grow a little at a
            time.
          </div>
        </section>
        <aside className="sidebar">
          <section className="profile-card">
            <div className="profile-top">
              <Avatar color={c.color} />
              <div>
                <span className="small muted">HELLO, NEIGHBOR</span>
                <h2>{c.name}</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Edit character"
                onClick={() => open("profile")}
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="profile-bottom">
              <button onClick={() => open("bank")}>
                <span className="coin-icon">
                  <Coins size={18} />
                </span>
                <strong>{c.balance}</strong>
                <span>coins</span>
                <ChevronRight size={15} />
              </button>
              <button onClick={() => open("bag")}>
                <Backpack size={18} />
                <span>My bag</span>
                <span className="bag-count">{count}</span>
              </button>
            </div>
          </section>
          <section className="adventure-card">
            <div className="eyebrow">
              <Sparkles size={14} /> A LITTLE ADVENTURE
            </div>
            <h2>
              {c.delivery === "carrying"
                ? "Special delivery!"
                : "A helping hand"}
            </h2>
            <p>
              {c.delivery === "carrying"
                ? `Your parcel is for ${parcel?.name ?? "your chosen place"}. Bring it over to earn your reward.`
                : "Visit Little Post and choose where you would like to deliver a package."}
            </p>
            <div className="delivery-drawing" aria-hidden="true">
              <span className="delivery-dots">· · ·</span>
              <Package size={42} />
              <span className="delivery-dots">· · ·</span>
              <Coffee size={32} />
            </div>
            <div className="reward">
              <span>
                <Coins size={15} /> Earn 15 coins
              </span>
              <span>No time limit</span>
            </div>
            <button
              className="primary full"
              onClick={() =>
                c.delivery === "carrying" ? goDelivery() : void go("post")
              }
            >
              {c.delivery === "carrying"
                ? parcel?.id === "cafe"
                  ? "Take it to the café"
                  : `Take it to ${parcel?.name ?? "your destination"}`
                : "Let’s help out"}
              <ArrowRight size={17} />
            </button>
          </section>
          {canDeliver && !panel && c.room !== "town" && deliver}
          {companion && (
            <section className="pet-card" aria-label="Your pet">
              <Heart size={20} />
              <div>
                <strong>{companion.name}</strong>
                <p>Your friend is following you.</p>
              </div>
            </section>
          )}
          <section className="places-card">
            <div className="section-title">
              <h2>Little places to go</h2>
              <MapPin size={17} />
            </div>
            <Place
              icon={<Sun size={20} />}
              title={gardenShop.name}
              subtitle="Seed pots and happy flowers · 5 coins"
              color="sage"
              onClick={() => void go("garden")}
            />
            <Place
              icon={<Coins size={20} />}
              title={resaleShop.name}
              subtitle="Sell items for pretend coins"
              color="lilac"
              onClick={() => void go("resale")}
            />
            <Place
              icon={<Wallet size={20} />}
              title={bank.name}
              subtitle="Save your pretend coins"
              color="sage"
              onClick={() => void go("bank")}
            />
            <Place
              icon={<Sun size={20} />}
              title={iceCreamShop.name}
              subtitle="A happy scoop · 5 coins"
              color="peach"
              onClick={() => void go("icecream")}
            />
            <Place
              icon={<Heart size={20} />}
              title={shelter.name}
              subtitle="Meet your animal friend"
              color="sage"
              onClick={() => void go("shelter")}
            />
            <Place
              icon={<Sparkles size={20} />}
              title={toyStore.name}
              subtitle="Toys to keep and play with"
              color="lilac"
              onClick={() => void go("toys")}
            />
            <Place
              icon={<Coffee size={20} />}
              title="Cloud Café"
              subtitle="A sip of something special"
              color="peach"
              onClick={() => void go("cafe")}
            />
            <Place
              icon={<Utensils size={20} />}
              title={restaurant.name}
              subtitle="Restaurant · Something yummy to eat"
              color="peach"
              onClick={() => void go("restaurant")}
            />
            <Place
              icon={<BookOpen size={20} />}
              title={library.name}
              subtitle="Free stories to read"
              color="lilac"
              onClick={() => void go("library")}
            />
            <Place
              icon={<GraduationCap size={20} />}
              title={school.name}
              subtitle="Little lessons, big discoveries"
              color="sage"
              onClick={() => void go("school")}
            />
            <Place
              icon={<Hotel size={20} />}
              title={hotel.name}
              subtitle="Cozy rooms and free meals"
              color="lilac"
              onClick={() => void go("hotel")}
            />
            <Place
              icon={<Send size={20} />}
              title="Little Post"
              subtitle="Small jobs, happy neighbors"
              color="sage"
              onClick={() => void go("post")}
            />
            <Place
              icon={<Home size={20} />}
              title="Your home"
              subtitle="Your very own cozy corner"
              color="lilac"
              onClick={() =>
                void perform(
                  { type: "room", room: `home:${c.id}` },
                  "Welcome home!",
                )
              }
            />
          </section>
          <section className="neighbors-card">
            <div className="section-title">
              <h2>Our neighborhood</h2>
              <span>{homes.length}</span>
            </div>
            <div className="neighbor-avatars">
              {homes.slice(0, 6).map((h) => (
                <button
                  key={h.id}
                  aria-label={`Visit ${h.name}'s home`}
                  onClick={() =>
                    void perform({ type: "room", room: `home:${h.id}` })
                  }
                >
                  <Avatar color={h.color} small />
                  <span>{h.id === c.id ? "You" : h.name}</span>
                </button>
              ))}
            </div>
            <button className="text-button" onClick={() => open("neighbors")}>
              A doorstep for everyone <ArrowRight size={14} />
            </button>
          </section>
        </aside>
      </main>
      <footer className="app-footer">
        <BuildVersion />
        <span>
          <Leaf size={13} /> Made for our kind of everyday magic.
        </span>
        <button onClick={() => open("help")}>Need a little help?</button>
      </footer>
      {mode === "preview" && (
        <div className="preview-banner">
          Local preview · Saves only in this browser · Other homes are sample
          homes{" "}
          <a href="/">
            Go to private sign-in <ArrowRight size={13} />
          </a>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Sparkles size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {panel && (
        <Modal
          title={title[panel]}
          eyebrow={
            panel === "cafe"
              ? "WELCOME TO CLOUD CAFÉ"
              : panel === "restaurant"
                ? "WELCOME TO OUR RESTAURANT"
                : panel === "post"
                  ? "LITTLE POST"
                  : "OUR WORLD"
          }
          close={() => {
            if (!busy) setPanel(null);
          }}
        >
          {panel === "shelter" && (
            <>
              <p className="modal-intro">{shelter.welcome}</p>
              {companion && (
                <p role="status">
                  {companion.name} is already your friend. You can have one pet
                  at a time.
                </p>
              )}
              {pets.length === 0 && (
                <p>
                  The shelter is getting ready for its first animal friends.
                </p>
              )}
              <div className="shop-list">
                {pets.map((pet) => (
                  <div className="shop-item" key={pet.id}>
                    <span
                      className="drink-art"
                      style={{ background: pet.color }}
                    >
                      {pet.emoji}
                    </span>
                    <div>
                      <h3>{pet.name}</h3>
                      <p>{pet.description}</p>
                    </div>
                    <button
                      className="price-button"
                      disabled={
                        busy || Boolean(c.petId) || c.balance < pet.price
                      }
                      onClick={() =>
                        void perform(
                          {
                            type: "adopt",
                            itemId: pet.id,
                            requestId: crypto.randomUUID(),
                          },
                          `${pet.name} is your new friend!`,
                          true,
                        )
                      }
                    >
                      <Coins size={15} />
                      {pet.price}
                      <span>Adopt</span>
                    </button>
                  </div>
                ))}
              </div>
              <p className="shop-balance">
                You have {c.balance} coins to spend.
              </p>
            </>
          )}
          {panel === "library" && <Library />}
          {panel === "school" && <School initialLessonId={schoolLesson} />}
          {panel === "decorate" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void perform(
                  { type: "decorate", ...homeStyle },
                  "Your home has a fresh new look!",
                  true,
                );
              }}
            >
              <p className="modal-intro">
                Pick your favorite colors. Decorating is free, and your visitors
                will see your choices!
              </p>
              <div
                className="home-color-preview"
                aria-label="Preview of your wall and floor colors"
              >
                <div style={{ background: homeStyle.wallColor }}>Walls</div>
                <div style={{ background: homeStyle.floorColor }}>Floor</div>
              </div>
              {(
                [
                  {
                    key: "wallColor",
                    label: "Wall color",
                    options: wallColors,
                  },
                  {
                    key: "floorColor",
                    label: "Floor color",
                    options: floorColors,
                  },
                ] as const
              ).map((group) => (
                <fieldset className="home-palette" key={group.key}>
                  <legend>{group.label}</legend>
                  <div>
                    {group.options.map((option) => (
                      <button
                        key={option.color}
                        type="button"
                        aria-pressed={homeStyle[group.key] === option.color}
                        onClick={() =>
                          setHomeStyle({
                            ...homeStyle,
                            [group.key]: option.color,
                          })
                        }
                      >
                        <span style={{ background: option.color }}>
                          {homeStyle[group.key] === option.color && (
                            <Check size={18} />
                          )}
                        </span>
                        {option.name}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setHomeStyle(defaultHomeStyle)}
              >
                Original colors
              </button>
              <button className="primary full" disabled={busy}>
                {busy ? "Saving…" : "Save my colors"}
              </button>
            </form>
          )}
          {panel === "profile" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void perform(
                  { type: "profile", name, color },
                  "Looking good, neighbor!",
                  true,
                );
              }}
            >
              <div className="avatar-editor">
                <Avatar color={color} />
                <span>Entirely, wonderfully you.</span>
              </div>
              <label className="field-label" htmlFor="character-name">
                What should we call you?
              </label>
              <input
                id="character-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                required
                placeholder="Your nickname"
                autoComplete="off"
              />
              <label className="field-label">Pick your favorite color</label>
              <div className="color-options">
                {avatarColors.map((clr) => (
                  <button
                    type="button"
                    key={clr}
                    aria-label={`Avatar color ${clr}`}
                    aria-pressed={color === clr}
                    style={{ background: clr }}
                    onClick={() => setColor(clr)}
                  >
                    {color === clr && <Check size={22} />}
                  </button>
                ))}
              </div>
              <button className="primary full" disabled={busy || !name.trim()}>
                {busy ? "Saving…" : "That’s me!"}
                <Check size={17} />
              </button>
            </form>
          )}
          {canDeliver && deliver}
          {panel === "hotelDining" && (
            <>
              <p className="modal-intro">
                Every meal is free. Choose something tasty to eat right here!
              </p>
              {hotelMeals.map((meal) => (
                <div className="shop-item" key={meal.id}>
                  <span
                    className="drink-art"
                    style={{ background: meal.color }}
                  >
                    {meal.emoji}
                  </span>
                  <div>
                    <h3>{meal.name}</h3>
                    <p>{meal.description}</p>
                  </div>
                  <button
                    className="secondary"
                    disabled={busy}
                    aria-label={`Enjoy free ${meal.name.toLowerCase()}`}
                    onClick={() =>
                      void perform(
                        {
                          type: "eatFree",
                          itemId: meal.id,
                          requestId: crypto.randomUUID(),
                        },
                        `Yum! You enjoyed ${meal.name.toLowerCase()} for free.`,
                      )
                    }
                  >
                    Enjoy · Free
                  </button>
                </div>
              ))}
            </>
          )}
          {(panel === "garden" ||
            panel === "cafe" ||
            panel === "restaurant" ||
            panel === "toys" ||
            panel === "icecream") && (
            <>
              <p className="modal-intro">
                {panel === "garden"
                  ? gardenShop.welcome
                  : panel === "icecream"
                    ? iceCreamShop.welcome
                    : panel === "toys"
                      ? toyStore.welcome
                      : panel === "restaurant"
                        ? restaurant.welcome
                        : "A treat for your travels, or a cozy moment at home. Everything goes into your bag."}
              </p>
              <div className="shop-list">
                {(panel === "garden"
                  ? seeds
                  : panel === "icecream"
                    ? iceCreams
                    : panel === "toys"
                      ? toys
                      : panel === "restaurant"
                        ? meals
                        : drinks
                ).map((item) => (
                  <div className="shop-item" key={item.id}>
                    <span
                      className="drink-art"
                      style={{ background: item.color }}
                    >
                      {item.emoji}
                    </span>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                    <button
                      className="price-button"
                      disabled={busy || c.balance < item.price}
                      onClick={() =>
                        void perform(
                          {
                            type: "buy",
                            itemId: item.id,
                            requestId: crypto.randomUUID(),
                          },
                          `${item.name} is in your bag!`,
                        )
                      }
                    >
                      <Coins size={15} />
                      {item.price}
                      <span>Buy</span>
                    </button>
                  </div>
                ))}
              </div>
              <p className="shop-balance">
                <Wallet size={16} /> You have {c.balance} coins to spend.
              </p>
            </>
          )}
          {panel === "post" && (
            <>
              <div className="job-hero">
                <Package size={54} />
                <span>Handle with a little love.</span>
              </div>
              <p className="modal-intro">
                Choose where this package should go. Deliver it to earn{" "}
                <strong>15 coins</strong>. There’s no timer, so enjoy the trip.
              </p>
              <label className="field-label" htmlFor="delivery-destination">
                Where would you like to deliver?
              </label>
              <select
                id="delivery-destination"
                value={
                  c.delivery === "carrying"
                    ? (c.deliveryTarget ?? "cafe")
                    : selectedDelivery.id
                }
                disabled={busy || c.delivery === "carrying"}
                onChange={(event) => setDeliveryChoice(event.target.value)}
              >
                {destinations.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name}
                  </option>
                ))}
              </select>
              <div className="job-route">
                <span>
                  <Send size={17} /> Little Post
                </span>
                <ArrowRight size={19} />
                <span>
                  <MapPin size={17} />{" "}
                  {c.delivery === "carrying"
                    ? parcel?.name
                    : selectedDelivery.name}
                </span>
              </div>
              <button
                className="primary full"
                disabled={busy || c.delivery === "carrying"}
                onClick={() =>
                  void perform(
                    {
                      type: "startJob",
                      destination: selectedDelivery.id,
                      requestId: crypto.randomUUID(),
                    },
                    `Parcel picked up! Take it to ${selectedDelivery.name}.`,
                    true,
                  )
                }
              >
                {c.delivery === "carrying"
                  ? "Your parcel is ready to deliver"
                  : "I’ll take the parcel"}
                <Package size={18} />
              </button>
              <p className="small muted center">
                {c.deliveries} deliveries made. Every one makes someone smile.
              </p>
            </>
          )}
          {panel === "homeItems" && (
            <>
              <p className="modal-intro">
                Your unpacked things stay here. Play with a toy, or put
                something back in your backpack.
              </p>
              {Object.keys(placedItems).length === 0 && (
                <p>
                  Nothing unpacked yet. Open your backpack to choose something!
                </p>
              )}
              {homeItemSpots.map((spot) => {
                const item = shopItems.find(
                  (entry) => entry.id === placedItems[spot.id],
                );
                return item ? (
                  <div className="shop-item" key={spot.id}>
                    <span
                      className="drink-art"
                      style={{ background: item.color }}
                    >
                      {item.emoji}
                    </span>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{spot.name}</p>
                    </div>
                    <div className="home-item-actions">
                      {seeds.some((seed) => seed.id === item.id) && (
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() =>
                            void perform(
                              {
                                type: "waterHome",
                                spotId: spot.id,
                                requestId: crypto.randomUUID(),
                              },
                              "You watered your seed. A flower bloomed!",
                              true,
                            )
                          }
                        >
                          Water and grow
                        </button>
                      )}
                      {item.shop === "toys" && (
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => {
                            void perform(
                              {
                                type: "playHome",
                                spotId: spot.id,
                                requestId: crypto.randomUUID(),
                              },
                              `You played with your ${item.name.toLowerCase()}!`,
                              true,
                            );
                            scene.current?.wave("✨");
                          }}
                        >
                          Play
                        </button>
                      )}
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() =>
                          void perform(
                            {
                              type: "pack",
                              spotId: spot.id,
                              requestId: crypto.randomUUID(),
                            },
                            `${item.name} is back in your backpack!`,
                          )
                        }
                      >
                        Pick up
                      </button>
                    </div>
                  </div>
                ) : null;
              })}
              <button className="secondary" onClick={() => open("bag")}>
                Open my backpack
              </button>
            </>
          )}
          {panel === "bag" && (
            <>
              {c.room === `home:${c.id}` ? (
                <div className="unpack-choice">
                  <label className="field-label" htmlFor="unpack-spot">
                    Unpack onto…
                  </label>
                  {freeSpots.length ? (
                    <select
                      id="unpack-spot"
                      value={selectedSpot}
                      onChange={(event) => setUnpackSpot(event.target.value)}
                    >
                      {freeSpots.map((spot) => (
                        <option value={spot.id} key={spot.id}>
                          {spot.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p>
                      Your spots are full. Put something back in your backpack
                      to make room.
                    </p>
                  )}
                  <button
                    className="secondary"
                    onClick={() => open("homeItems")}
                  >
                    Pick up items
                  </button>
                </div>
              ) : (
                <p>Visit your own home to unpack items and leave them there.</p>
              )}
              {count === 0 ? (
                <div className="empty-state">
                  <Backpack size={45} />
                  <h3>A little room for lovely things</h3>
                  <p>Visit the café or restaurant to pick out a treat.</p>
                  <button
                    className="secondary"
                    onClick={() => {
                      setPanel(null);
                      void go("cafe");
                    }}
                  >
                    Let’s visit the café
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                shopItems
                  .filter((item) => c.inventory[item.id] > 0)
                  .map((item) => (
                    <div className="shop-item" key={item.id}>
                      <span
                        className="drink-art"
                        style={{ background: item.color }}
                      >
                        {item.emoji}
                      </span>
                      <div>
                        <h3>{item.name}</h3>
                        <p>{c.inventory[item.id]} in your bag</p>
                      </div>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => {
                          void perform(
                            {
                              type: "use",
                              itemId: item.id,
                              requestId: crypto.randomUUID(),
                            },
                            item.shop === "garden"
                              ? "A lovely little plant! Unpack seed pots at home, then water them in Pick up items."
                              : item.shop === "toys"
                                ? `You played with your ${item.name.toLowerCase()}! It stays in your bag.`
                                : item.shop === "icecream"
                                  ? "Yum! That was a lovely ice cream."
                                  : item.shop === "restaurant"
                                    ? "Yum! That was a lovely meal."
                                    : "A happy little sip. Delicious!",
                          );
                          scene.current?.wave(
                            item.shop === "toys" ? "✨" : "❤️",
                          );
                        }}
                      >
                        {item.shop === "garden"
                          ? "Admire"
                          : item.shop === "toys"
                            ? "Play"
                            : "Enjoy"}
                      </button>
                      {c.room === `home:${c.id}` && (
                        <button
                          className="secondary"
                          disabled={busy || !selectedSpot}
                          onClick={() =>
                            void perform(
                              {
                                type: "unpack",
                                itemId: item.id,
                                spotId: selectedSpot!,
                                requestId: crypto.randomUUID(),
                              },
                              `${item.name} is unpacked in your home!`,
                              true,
                            )
                          }
                        >
                          Unpack
                        </button>
                      )}
                    </div>
                  ))
              )}
              {c.delivery === "carrying" && (
                <div className="handoff">
                  <Package />
                  <div>
                    <strong>A parcel for {parcel?.name}</strong>
                    <small>Deliver it to earn 15 coins.</small>
                  </div>
                </div>
              )}
            </>
          )}
          {panel === "resale" && (
            <>
              <p className="modal-intro">{resaleShop.welcome}</p>
              <p>
                Unpacked things need to go back in your backpack first. Pets
                stay with you.
              </p>
              {shopItems
                .filter((item) => c.inventory[item.id] > 0)
                .map((item) => (
                  <div className="shop-item" key={item.id}>
                    <span
                      className="drink-art"
                      style={{ background: item.color }}
                    >
                      {item.emoji}
                    </span>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{c.inventory[item.id]} in your backpack</p>
                    </div>
                    <button
                      className="price-button"
                      disabled={busy}
                      onClick={() =>
                        void perform(
                          {
                            type: "sell",
                            itemId: item.id,
                            requestId: crypto.randomUUID(),
                          },
                          `Sold ${item.name} for ${resalePrice(item.price)} coins!`,
                        )
                      }
                    >
                      Sell one · +{resalePrice(item.price)}
                    </button>
                  </div>
                ))}
              {count === 0 && (
                <p role="status">
                  Your backpack has no items to sell right now.
                </p>
              )}
              <p className="shop-balance">
                You have {c.balance} coins in your pocket.
              </p>
            </>
          )}
          {panel === "bank" && (
            <>
              <div className="bank-balance">
                <Coins size={32} />
                <strong>{c.balance}</strong>
                <span>coins in your pocket</span>
              </div>
              <p className="bank-savings">
                <strong>{c.savings ?? 0}</strong> coins in savings
              </p>
              <p className="modal-intro">{bank.welcome}</p>
              {c.room === "shop:bank" ? (
                <>
                  <label className="field-label" htmlFor="bank-coins">
                    How many coins?
                  </label>
                  <input
                    id="bank-coins"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={bankAmount}
                    onChange={(event) => setBankAmount(event.target.value)}
                  />
                  <div className="bank-actions">
                    <button
                      className="primary"
                      disabled={busy || !validCoins || coinsToMove > c.balance}
                      onClick={() =>
                        void perform(
                          {
                            type: "deposit",
                            coins: coinsToMove,
                            requestId: crypto.randomUUID(),
                          },
                          `${coinsToMove} coins are now in savings!`,
                        )
                      }
                    >
                      Put into savings
                    </button>
                    <button
                      className="secondary"
                      disabled={
                        busy || !validCoins || coinsToMove > (c.savings ?? 0)
                      }
                      onClick={() =>
                        void perform(
                          {
                            type: "withdraw",
                            coins: coinsToMove,
                            requestId: crypto.randomUUID(),
                          },
                          `${coinsToMove} coins are back in your pocket!`,
                        )
                      }
                    >
                      Take out of savings
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="secondary"
                  onClick={() => {
                    setPanel(null);
                    void go("bank");
                  }}
                >
                  Let’s visit the bank
                </button>
              )}
              <h3 className="ledger-title">Your recent comings & goings</h3>
              {receipts.length ? (
                receipts.map((r) => (
                  <div className="receipt" key={r.id}>
                    <span
                      className={
                        r.amount > 0 ? "receipt-icon positive" : "receipt-icon"
                      }
                    >
                      {r.amount > 0 ? (
                        <ArrowDownLeft size={17} />
                      ) : (
                        <Coffee size={17} />
                      )}
                    </span>
                    <div>
                      <strong>{r.label}</strong>
                      <small>
                        {new Date(r.at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </small>
                    </div>
                    <b className={r.amount > 0 ? "positive-text" : ""}>
                      {r.amount > 0 ? "+" : ""}
                      {r.amount || "—"}
                    </b>
                  </div>
                ))
              ) : (
                <p>Your 50 welcome coins are ready for your first adventure.</p>
              )}
            </>
          )}
          {panel === "neighbors" && (
            <>
              <p className="modal-intro">
                Everyone gets a little home here. Knock on a door and make
                yourself comfortable.
              </p>
              {homes.map((h) => (
                <div className="neighbor-row" key={h.id}>
                  <Avatar color={h.color} small />
                  <div>
                    <h3>
                      {h.name}
                      {h.id === c.id ? " · you" : ""}
                    </h3>
                    <p>A cozy home in {worldName}</p>
                  </div>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      void perform(
                        { type: "room", room: `home:${h.id}` },
                        `Welcome to ${h.name}’s home!`,
                        true,
                      )
                    }
                  >
                    Visit
                    <Home size={15} />
                  </button>
                </div>
              ))}
            </>
          )}
          {panel === "help" && (
            <div className="help-list">
              <p>
                <MapPin />
                <span>
                  <strong>Go for a wander</strong>Tap a path or use the arrow
                  keys / WASD. Tap a building to walk to its door.
                </span>
              </p>
              <p>
                <Coffee />
                <span>
                  <strong>Make a little stop</strong>Use the button near a
                  doorway, or press E, to visit. The Places buttons help you
                  find your way.
                </span>
              </p>
              <p>
                <Package />
                <span>
                  <strong>Lend a helping hand</strong>Pick up a parcel at Little
                  Post. Choose a destination and deliver your parcel to earn 15
                  coins.
                </span>
              </p>
              <p>
                <Heart />
                <span>
                  <strong>Make it yours</strong>Use the pencil by your name to
                  change your nickname and color. Wave to someone, visit a home,
                  and enjoy a treat from your bag.
                </span>
              </p>
              <p>
                <ShieldCheck />
                <span>
                  <strong>Your progress has a home</strong>
                  {mode === "preview"
                    ? "This local preview saves your purchases and profile in this browser. Multiplayer lives in the private world."
                    : "Your purchases and progress save to your private world. You can play alone or together, with an internet connection."}
                </span>
              </p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
function Avatar({ color, small = false }: { color: string; small?: boolean }) {
  return (
    <span
      className={`avatar ${small ? "avatar-small" : ""}`}
      style={{ "--shirt": color } as React.CSSProperties}
    >
      <span className="avatar-shirt" />
      <span className="avatar-face">
        <span className="avatar-hair" />
        <span className="avatar-eyes" />
        <span className="avatar-smile" />
      </span>
    </span>
  );
}
function Place({
  icon,
  title,
  subtitle,
  color,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button className="place" onClick={onClick}>
      <span className={`place-icon ${color}`}>{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <ChevronRight size={16} />
    </button>
  );
}
function Library() {
  const [bookId, setBookId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const book = books.find((entry) => entry.id === bookId);
  if (!book)
    return (
      <>
        <p className="modal-intro">{library.welcome}</p>
        {books.map((entry) => (
          <div className="shop-item" key={entry.id}>
            <span
              className="drink-art"
              style={{ background: entry.color }}
              aria-hidden="true"
            >
              {entry.emoji}
            </span>
            <div>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
            </div>
            <button
              className="secondary"
              aria-label={`Read ${entry.title}`}
              onClick={() => {
                setBookId(entry.id);
                setPage(0);
              }}
            >
              Read
            </button>
          </div>
        ))}
      </>
    );
  return (
    <div className="library-reader">
      <button className="text-button" onClick={() => setBookId(null)}>
        <ArrowLeft size={16} /> Back to books
      </button>
      <h3>
        {book.emoji} {book.title}
      </h3>
      <div aria-live="polite" aria-atomic="true">
        <p className="story-page">{book.pages[page]}</p>
        <p className="small muted">
          Page {page + 1} of {book.pages.length}
          {page === book.pages.length - 1 ? " · The end!" : ""}
        </p>
      </div>
      <div className="book-navigation">
        <button
          className="secondary"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          <ArrowLeft size={16} /> Previous
        </button>
        {page < book.pages.length - 1 ? (
          <button className="primary" onClick={() => setPage(page + 1)}>
            Next page <ArrowRight size={16} />
          </button>
        ) : (
          <button className="primary" onClick={() => setBookId(null)}>
            Choose another book
          </button>
        )}
      </div>
    </div>
  );
}
function Modal({
  title,
  eyebrow,
  close,
  children,
}: {
  title: string;
  eyebrow: string;
  close: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close();
        }
      }}
    >
      <button
        className="modal-close icon-button"
        aria-label="Close dialog"
        onClick={close}
      >
        <X size={21} />
      </button>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: displayError(error) };
  }
  render() {
    return this.state.error ? (
      <div className="setup">
        <Sprout size={40} />
        <h1>The gate needs a little attention.</h1>
        <p>{this.state.error}</p>
        <button className="primary" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
