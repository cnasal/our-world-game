# Working on Our World

This is a private family game for an adult and children aged 6, 9, and 11. Favor small, understandable changes and clear, welcoming text.

- Stack: Phaser 3, React, TypeScript, Vite, Clerk, Convex. Use the lockfile and existing architecture.
- Keep creative content in `src/content/` when possible. See MAKE_SOMETHING.md.
- Backend game functions must verify world membership. Never auto-enroll arbitrary signed-in accounts into an existing world.
- World creation and adding members currently use internal deployment-only functions in `convex/admin.ts`.
- Keep currency, item changes, and rewards atomic on the server. Preserve retry IDs and transaction checks.
- Nicknames are editable display values, never identifiers. Do not change existing item IDs to rename an item.
- Do not introduce fixed four-player arrays into the live model. The four sample homes in the dev-only local preview are illustrative.
- Do not put secret keys in frontend code or `VITE_` environment variables. Keep `.env.local` ignored.
- For backend gameplay changes, run `npm test`; run `npm run build` for code changes. Use the browser smoke test when changing gameplay interaction. Cosmetic/content changes do not need new tests that mirror the implementation.
- Preview mode is development-only and uses isolated local storage. Never silently substitute it for failed live authentication.
- Avoid migrations or reset commands that erase the family's saved progress. Use an isolated development world for experiments.
- Describe changes simply, including what a child can try to see the result.
