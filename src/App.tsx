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
  return <GameShell bridge={bridge} />;
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
      <footer>Little adventures. Big imaginations. Made together.</footer>
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
    transact = useMutation(api.transact),
    emote = useMutation(api.emote);
  const connection = useConvexConnectionState();
  const [ready, setReady] = useState(false),
    [networkError, setNetworkError] = useState("");
  const pos = useRef({ ...town.spawn });
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
      pos.current = { x, y };
      if (!connection.isWebSocketConnected || pending.current) return;
      pending.current = moveMutation({ worldId, x, y })
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
      await pending.current;
      if (action.type === "room") {
        await enter({ worldId, room: action.room });
        pos.current = { ...town.spawn };
        setRoom(action.room);
      } else if (action.type === "profile")
        await profile({ worldId, name: action.name, color: action.color });
      else {
        await moveMutation({ worldId, ...pos.current });
        await transact({
          worldId,
          type: action.type,
          itemId: "itemId" in action ? action.itemId : undefined,
          requestId:
            "requestId" in action ? action.requestId : crypto.randomUUID(),
        });
      }
    },
    [
      connection.isWebSocketConnected,
      enter,
      moveMutation,
      profile,
      transact,
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
    character: { ...saved.character, room, ...town.spawn },
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
  | "profile"
  | "bag"
  | "bank"
  | "cafe"
  | "restaurant"
  | "library"
  | "school"
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
  const open = (value: Panel) => {
    if (value === "profile") {
      setName(c.name);
      setColor(c.color);
    }
    setPanel(value);
  };
  const interact = (id: string) => {
    if (id === "home")
      void perform({ type: "room", room: `home:${c.id}` }, "Welcome home!");
    else if (id === "school")
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
    } else if (id === "exit") void perform({ type: "room", room: "town" });
    else if (
      ["cafe", "restaurant", "library", "post", "neighbors"].includes(id)
    )
      open(id as Panel);
  };
  const go = async (id: string) => {
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
  const title = {
    profile: "A little more you",
    bag: "Your little collection",
    bank: "Your pocket of possibilities",
    cafe: "Something lovely to sip",
    restaurant: restaurant.name,
    library: library.name,
    school: school.name,
    post: "A little job. A big help.",
    neighbors: "A neighborhood of friends",
    help: "Make yourself at home",
  };
  const count = Object.values(c.inventory).reduce((sum, n) => sum + n, 0);
  const online = bridge.neighbors.filter(
    (n) => n.id !== c.id && Date.now() - n.updatedAt < 45000,
  );
  const isHome = c.room.startsWith("home:");
  const isSchool = c.room === "school";
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
                    : worldName}
                <span className="heading-flower">✳</span>
              </h1>
              <p>
                {isHome
                  ? "Come in, get cozy, stay a little while."
                  : isSchool
                    ? "Walk to a desk and discover something new."
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
              <button
                className="back-town"
                onClick={() => void perform({ type: "room", room: "town" })}
              >
                <ArrowLeft size={16} /> Back to town
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
                  {nearby.startsWith("lesson:")
                    ? `Try ${schoolStations.find((entry) => entry.id === nearby)?.name ?? "a lesson"}`
                    : nearby === "exit"
                      ? "Back to town"
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
                ? "The café is waiting for its parcel. A small walk, a lovely reward."
                : "The café could use a delivery. Pop over to Little Post to pick it up."}
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
                void go(c.delivery === "carrying" ? "cafe" : "post")
              }
            >
              {c.delivery === "carrying"
                ? "Take it to the café"
                : "Let’s help out"}
              <ArrowRight size={17} />
            </button>
          </section>
          <section className="places-card">
            <div className="section-title">
              <h2>Little places to go</h2>
              <MapPin size={17} />
            </div>
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
          {panel === "library" && <Library />}
          {panel === "school" && <School initialLessonId={schoolLesson} />}
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
          {(panel === "cafe" || panel === "restaurant") && (
            <>
              <p className="modal-intro">
                {panel === "restaurant"
                  ? restaurant.welcome
                  : "A treat for your travels, or a cozy moment at home. Everything goes into your bag."}
              </p>
              {panel === "cafe" && c.delivery === "carrying" && (
                <div className="handoff">
                  <Package size={23} />
                  <div>
                    <strong>You brought our parcel!</strong>
                    <small>Thank you for helping out.</small>
                  </div>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      void perform(
                        { type: "finishJob", requestId: crypto.randomUUID() },
                        "Delivery complete! 15 coins for your helping hands.",
                      )
                    }
                  >
                    Deliver · +15
                  </button>
                </div>
              )}
              <div className="shop-list">
                {(panel === "restaurant" ? meals : drinks).map((item) => (
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
                Cloud Café is waiting for a box of cups. Carry a parcel across
                the square and earn <strong>15 coins</strong>. There’s no timer,
                so enjoy the walk.
              </p>
              <div className="job-route">
                <span>
                  <Send size={17} /> Little Post
                </span>
                <ArrowRight size={19} />
                <span>
                  <Coffee size={17} /> Cloud Café
                </span>
              </div>
              <button
                className="primary full"
                disabled={busy || c.delivery === "carrying"}
                onClick={() =>
                  void perform(
                    { type: "startJob" },
                    "Parcel picked up! Take it to Cloud Café.",
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
          {panel === "bag" && (
            <>
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
                            item.shop === "restaurant"
                              ? "Yum! That was a lovely meal."
                              : "A happy little sip. Delicious!",
                          );
                          scene.current?.wave("❤️");
                        }}
                      >
                        Enjoy
                      </button>
                    </div>
                  ))
              )}
              {c.delivery === "carrying" && (
                <div className="handoff">
                  <Package />
                  <div>
                    <strong>A parcel for Cloud Café</strong>
                    <small>Deliver it to earn 15 coins.</small>
                  </div>
                </div>
              )}
            </>
          )}
          {panel === "bank" && (
            <>
              <div className="bank-balance">
                <Coins size={32} />
                <strong>{c.balance}</strong>
                <span>lovely little possibilities</span>
              </div>
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
                  Post. Deliver it to Cloud Café to earn 15 coins.
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
