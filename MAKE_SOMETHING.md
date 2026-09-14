# Let’s make something!

Our World belongs to all of us. You can start with one tiny change.

## Make your character yours

Click the pencil beside your name in the game. Give yourself a nickname and choose a shirt color. Your home and coins stay yours when you change your name.

## Invent a drink

Open `src/content/town.ts`. Find the drinks list. Copy a drink entry and give it a new, unique `id`, a name, a description, a price, an emoji, and a color.

Try this idea with an AI helper:

> Add “Moonlight Milk” to Cloud Café. It should cost 7 coins and have a blue cup background. Use the existing drink system. Show me which file you changed and how to try it in the local preview.

A new drink automatically appears in the café and works with the bag and bank. Existing item IDs are permanent: changing an ID can hide items people already bought, so change the display name instead.

## Write a library story

Open `src/content/library.ts`. Each book has a title, a short description, and a list of pages. Write a few short sentences for each page. Stories are free to read at The Nasal Library.

> Add a three-page story about a cat who learns to bake. Keep the sentences short and give it a happy ending.

## Make a school lesson

Open `src/content/school.ts`. Each lesson has short questions, answer choices, a correct answer, and a helpful hint. Walk inside The Nasal School and tap a subject desk to try it. You can try answers again and explore at your own pace.

> Add a little lesson about shapes with three questions and friendly hints.

## Take a cozy break

Tap a sofa or chair to sit, or tap a bed to lie down. The buttons below the game also help you walk to furniture. Use **Stand up**, an arrow key, or tap the floor to get up. You can rest in a neighbor’s home, too.

Furniture locations live in `src/content/furniture.ts`. Each spot needs a clear place beside it to stand up.

## Make the hotel welcoming

Visit The Nasal Hotel at the end of the street. Walk through the lobby doors to explore Cloud, Sunflower, and Star rooms, or enjoy a free meal in the dining room. Beds and chairs work here too.

Room names, rug colors, and free meals live in `src/content/hotel.ts`. Hotel meals are eaten in the dining room and never cost coins.

## Deliver a package

Visit Little Post and choose a destination before taking your parcel. The delivery button guides you there. Bring home deliveries inside the right home, and hotel room deliveries inside the chosen room. Press **Deliver · +15** when you arrive. Old café parcels still go to Cloud Café.

The list of delivery places lives in `src/content/deliveries.ts`.

## Explore inside the shops

The café, restaurant, library, and Little Post each have a room you can walk around. Tap a counter or use the button below the game to order, pick a book, or collect a parcel. You can sit down and use the door to leave.

Room colors and counter labels live in `src/content/interiors.ts`.

## Check your version

The small **Built** date and time at the bottom shows when this copy of the game was built. It uses UTC so everyone can compare the same timestamp. Development previews say **Dev**. The timestamp stays the same when you refresh; a new deployment has a new build time.

## Write something kind

Think of a welcoming sentence for the café or a funny description for a drink. Short sentences are great, especially for our younger readers.

> Change the description of Rainbow Cocoa to “A chocolate hug with extra sprinkles.” Keep its item ID and price the same.

## Design a place

Draw a shop or room on paper or an iPad. Decide where the door, windows, furniture, and paths should go. An adult can help turn it into game scenery.

> Help me make the starter-home rug blue. Explain the small change in `src/game/TownScene.ts`. Keep the doors and walking paths usable.

## Try it safely

1. Make one small change.
2. Open the local game URL with `?preview` at the end.
3. Try your idea. Is it easy to understand? Can you still walk around?
4. Show your family.
5. Ask an adult to help put the change into the shared world.

The local preview is a practice copy. Its coins and purchases do not change the family town. Do not paste account passwords or secret keys into an AI chat.

The production build also publishes `version.json`. Open games check it once a
minute while visible, when returning to the tab, and when reconnecting. A changed
build shows a **Refresh game** notice; it never reloads automatically during play.
Development previews skip this check. To check the notice locally, run
`npm run build`, serve it with `npm run preview -- --port 5180`, then run
`node scripts/update-check.mjs` (with the browser library path if needed).
