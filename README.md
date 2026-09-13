# Our World

A private family town built with Phaser, React, TypeScript, Vite, Clerk, and Convex. The first neighborhood is **Willowbrook**.

## Play locally

```sh
npm ci
npm run dev
```

Open the **Local URL printed by Vite**. If another project is using port 5173, Vite chooses another port. Sign in with your Clerk account to enter the private world.

Your provided development service settings are in `.env.local` (ignored by Git). `.env.example` lists the settings for a new checkout. Vite uses `VITE_CLERK_PUBLISHABLE_KEY`; the supplied `NEXT_PUBLIC_…` value has been mapped to that name. No Clerk secret key is required by this application.

For an isolated local preview, append `?preview` to the development URL. It uses this browser’s local storage and four sample home names. It does **not** connect to the private world or simulate other online players. The preview switch is disabled in production builds. Clearing the `our-world-preview-v1` local storage entry resets only this preview.

## Current deployment

- Convex development deployment: `https://formal-poodle-790.convex.cloud`
- Clerk development issuer: `https://precise-ferret-1832.clerk.accounts.dev`
- Private world: **Willowbrook**
- World ID: `jn7cznky5cbtjtby2te4scr1dd8eaags`
- Owner account has been added. Its initial nickname is **Neighbor 1**.

The backend functions, indexes, and Clerk issuer configuration are deployed. The frontend currently runs locally; this repository does not yet have a public hosting deployment.

### Finish Clerk setup

In the Clerk dashboard, activate the **Convex integration** for this application (the token audience must be `convex`). This dashboard setting cannot be changed using a publishable key. See the [official integration guide](https://docs.convex.dev/auth/clerk).

Configure the login methods you want, such as username/password, and create the family accounts. Use restricted signup if desired. Regardless of signup settings, **only accounts explicitly added to a world can access its data**. A successful login without membership shows a waiting screen and the account’s Clerk user ID.

## Add family members

Create each person’s account in Clerk, then use their `user_…` ID:

```sh
npx convex run admin:addMember '{"worldId":"jn7cznky5cbtjtby2te4scr1dd8eaags","subject":"user_REPLACE_ME"}'
```

This internal, deployment-authenticated command adds a membership, a character, 50 welcome coins, and a starter home. The initial name is `Neighbor 2`, `Neighbor 3`, and so on. Names and avatar colors are editable with the pencil in the game. Repeating the command for the same account does not duplicate it.

There is no four-person limit. The model supports multiple worlds and arbitrary membership counts; ten-member behavior is covered by backend tests. Real-device latency and hosting usage still need a family playtest; ten simultaneous physical devices have not been tested.

To create another isolated world (for example, for development):

```sh
npx convex run admin:createWorld '{"name":"Practice Garden","ownerSubject":"user_REPLACE_ME"}'
```

Save the returned world ID and add members to that world explicitly. This command intentionally creates a new world each time. Members of one world cannot read or enter another world unless separately added. A user with multiple worlds gets a chooser at sign-in.

## First playable loop

1. Walk with arrow keys/WASD, or tap a path. Tap a building or a Places button to walk to its door.
2. Pick up a café parcel at **Little Post**.
3. Carry it to **Cloud Café**, then press **Deliver** to earn 15 coins.
4. Buy a drink; open **My bag** to enjoy it.
5. Visit your starter home or another member’s home.
6. Use the profile pencil to rename your character or choose another color.

The home and neighbor menus provide quick travel. Homes currently have a fixed furnished layout and permit visits from members of the same world. Decorating, house permissions, gifting, player-operated registers, and co-op café shifts are planned next.

Live progress is saved in Convex. Each new browser session starts in the town square. Playing alone still requires internet. Movement is locally responsive, publishes at about 7 updates/second while moving, and smooths remote positions over roughly 120 ms. Idle sessions heartbeat every 10 seconds, with a 45-second presence timeout. Only positions in the current room are subscribed to. These are initial tuning values, not guaranteed network latency.

## Work on the game

```sh
npm run backend       # Watch and sync backend changes
npm run dev           # Frontend, in a second terminal
npm test              # Private access and gameplay transaction tests
npm run build         # TypeScript checks + production bundle
npm run format        # Format source and documentation
```

The browser smoke test uses Playwright and a running development server:

```sh
npx playwright install chromium
GAME_TEST_URL=http://localhost:5173 npm run test:browser
```

On Linux, install the browser’s system dependencies if Playwright reports missing shared libraries. The smoke test uses a new isolated browser context and only the local preview; it does not buy items or edit profiles in your live world. It covers typing a name, navigation, the job loop, purchases, consumption, visits, reload persistence, tablet/phone layouts, and the Clerk sign-in screen. It does not sign in as you.

## Where to make changes

| File                    | Change here                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `src/content/town.ts`   | Drinks, descriptions, prices, avatar colors, and map stops       |
| `src/game/TownScene.ts` | Drawn scenery, room furniture, pathfinding, character appearance |
| `src/styles.css`        | Interface colors, spacing, and responsive layout                 |
| `src/App.tsx`           | Menus, shop screens, profiles, and live service connection       |
| `convex/schema.ts`      | Persistent world data                                            |
| `convex/game.ts`        | Membership checks, purchases, jobs, and presence                 |
| `convex/admin.ts`       | Deployment-only world and membership setup                       |

See [MAKE_SOMETHING.md](MAKE_SOMETHING.md) for child-friendly project ideas and [PLAN.md](PLAN.md) for the next milestones.

Purchases and job payouts are server-authorized atomic transactions. Receipts make retries idempotent. Character IDs, rather than nicknames, link homes and progress. Movement is lightweight and client-reported; this is a relaxed private game, not a competitive authoritative simulation.

## Share across devices

For devices on the same network, use the Network URL Vite prints if your computer’s firewall permits it. A hosted HTTPS frontend is the next step for convenient play from anywhere. Publish `dist/` to a static host with an SPA fallback and configure production Clerk/Convex settings before treating it as a permanent public deployment. Never put deployment credentials or Clerk secret keys in `VITE_` variables: those are bundled into the browser.


## Sevalla build and backend deployment

Use a Static Site with Node 24, publish directory `dist`, and this build command:

```sh
npm ci --include=dev && npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name VITE_CONVEX_URL
```

Set these build-time environment variables in Sevalla:

- `CONVEX_DEPLOY_KEY`: the **production** deployment key from Convex; store as a secret.
- `VITE_CLERK_PUBLISHABLE_KEY`: the publishable key for the Clerk instance used by the deployed game.

The deploy command supplies `VITE_CONVEX_URL` to the frontend build, so do not pin it to the development deployment. Leave `npm run build` as a local-only build to avoid recursive deploy commands.

On the **production Convex deployment**, set `CLERK_JWT_ISSUER_DOMAIN` to the matching Clerk issuer and enable the Convex integration in that Clerk instance. The deployment key must never use a `VITE_` prefix or be committed to Git.

Deploying functions does not copy development data. Set up the family world and memberships in production using `npx convex run --prod admin:createWorld ...` and `npx convex run --prod admin:addMember ...`, with the correct production Clerk user IDs. Preserve development progress separately if you want to migrate it.

See [Convex custom hosting](https://docs.convex.dev/production/hosting/custom).
