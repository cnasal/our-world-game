import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import App, { PreviewApp } from "./App";
import "./styles.css";
const preview =
  import.meta.env.DEV && new URLSearchParams(location.search).has("preview");
const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const url = import.meta.env.VITE_CONVEX_URL;
const root = ReactDOM.createRoot(document.getElementById("root")!);
if (preview)
  root.render(
    <React.StrictMode>
      <PreviewApp />
    </React.StrictMode>,
  );
else if (!key || !url)
  root.render(
    <div className="setup">
      <h1>Our World</h1>
      <p>Add the service settings in .env.local to connect your town.</p>
      {import.meta.env.DEV && <a href="?preview">Explore the local preview</a>}
    </div>,
  );
else {
  const convex = new ConvexReactClient(url);
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={key}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </React.StrictMode>,
  );
}
