import { useEffect, useState } from "react";

// This file is published alongside the game, so failed builds cannot announce an update.
export function UpdateNotice() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (import.meta.env.DEV) return;
    let stopped = false;
    let pending = false;
    const controller = new AbortController();
    async function check() {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const url = new URL(
          `${import.meta.env.BASE_URL}version.json`,
          location.origin,
        );
        url.searchParams.set("check", String(Date.now()));
        const response = await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const version = await response.json();
        if (!stopped) {
          setAvailable(
            typeof version.builtAt === "string" &&
              Number.isFinite(Date.parse(version.builtAt)) &&
              version.builtAt !== import.meta.env.VITE_BUILD_TIME,
          );
        }
      } catch {
        // Keep playing when offline or when the host is temporarily unavailable.
      } finally {
        pending = false;
      }
    }
    void check();
    const interval = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, []);

  if (!available) return null;
  return (
    <div className="update-notice" role="status">
      <span>A new update is ready! Refresh when you’re ready to try it.</span>
      <button className="secondary" onClick={() => window.location.reload()}>
        Refresh game
      </button>
    </div>
  );
}
