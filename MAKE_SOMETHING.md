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

### Toys

`src/content/toys.ts` holds The Nasal Toy Store's name, welcome, and toy catalog.
Players can walk inside, use the counter, sit on the chairs, and deliver packages.
Purchased toys stay in the bag when **Play** is clicked; food and drinks still get
used up. Keep toy IDs stable to preserve saved collections. Run
`node scripts/toy-check.mjs` against the development preview to check the toy-store
walkthrough (default port 5176, or set `GAME_TEST_URL`).

### Animal shelter and companions

`src/content/pets.ts` contains the shelter's pets and adoption prices. Cats, dogs,
and ducks each cost 80 coins. Keep pet IDs stable, just like item IDs.
A character's optional `petId` stores their one companion separately from the
backpack. Adoption checks membership, shelter entry, coins, and existing pet
ownership in one server transaction, with the usual retry receipt.
`src/game/PetFollower.ts` draws companions and follows the owner's recent footsteps;
companions travel between rooms and wait while their owners sit or lie down.
The shared room subscription includes pets so other players can see them.
The shelter also has seats and accepts package deliveries.
Run `node scripts/pet-check.mjs` against the development preview to check adoption,
following, saved ownership, room changes, shared pets, and phone layout. Its test
coins are kept only in the browser's isolated preview save.

### Ice cream shop

`src/content/iceCream.ts` holds The Nasal Ice Cream Shop's flavors and prices.
Each scoop costs 5 coins and goes into the bag until enjoyed. The shop is just
past the hotel and supports walking inside, seats, companions, and deliveries.
Keep flavor IDs stable so saved ice creams still work. Run
`node scripts/ice-cream-check.mjs` against the development preview for its walkthrough.

### Home colors

At home, choose **Decorate my home** to preview and save wall and floor colors
for free. `src/content/homes.ts` holds the available colors and original defaults.
Saved colors belong to the character's ID, so changing a nickname keeps the decor.
Only the owner's home can be changed; visitors see the saved colors. Painting
updates the room without moving people, pets, or furniture. Existing homes keep
their original look until decorated. Use `node scripts/home-colors-check.mjs`
against the development preview to check saving, canceling, restoring defaults,
resting during painting, visitor isolation, and phone layout.

### Bank savings

The Nasal Bank has a walkable room, seats, a counter, and package deliveries.
Players can deposit or withdraw whole pretend coins with no fees. Savings are
stored separately from pocket coins in the optional character `savings` field;
old characters begin with zero savings. Purchases still use pocket coins only.
`src/content/bank.ts` shares transfer validation with the preview. Live transfers
verify world membership and bank entry, update both balances atomically, and
preserve the existing retry receipts. Players can see their balances from the
pocket button anywhere, but must visit the bank to move coins.
Run `node scripts/bank-check.mjs` against the development preview for the bank walkthrough.

### Unpacking at home

In your own home, open the backpack, choose one of six shelf/table/rug spots,
and click **Unpack**. Items leave the bag and stay visibly in the house for
visitors to see. Click a placed item or **Things in my home** to **Play** with any
toy without repacking it, or **Put back in backpack**. Food can be packed back
and enjoyed from the bag. Pets and delivery parcels are separate from this system.
`src/content/homeItems.ts` defines spots and shared transfer validation. The
server checks home ownership and changes the bag and placed items atomically,
using retry receipts to prevent duplicates. Existing homes start with no placed
items. Run `node scripts/unpack-check.mjs` against the isolated development preview.

### Resale shop

The Nasal Resale Shop buys one backpack item at a time for half its catalog price,
rounded down. `src/content/resale.ts` defines the name and pricing rule. Each sale
button shows the payout before selling. Unpacked items must be packed first;
pets, savings, homes, and parcels are not sale items. Live sales verify membership,
shop entry, and ownership, then remove the item and award pocket coins atomically
with retry receipts. The shop supports seats, visiting pets, and deliveries.
Run `node scripts/resale-check.mjs` against the development preview for the walkthrough.

### Garden shop

Little Bloom Garden Shop sells sunflower, daisy, and tulip seed pots for 5 coins.
Unpack a pot in your own home, open **Pick up items**, and choose **Water and
grow**. It blooms straight away and stays as a decoration. Flowers can be picked
up and unpacked again; admiring a plant keeps it in the bag. There is no timer or
wilting. The shop has seats and accepts deliveries.
`src/content/garden.ts` contains the seeds and flowers. Watering uses the existing
atomic home-item transactions and retry receipts, with no saved-data migration.
Run `node scripts/garden-check.mjs` against the development preview to try it.

### Fancy dresses

Visit **Fancy Dress Boutique** at the far right of town. Pink, yellow, and blue
fancy dresses cost 15 coins each. Buy a dress, open **My outfits**, and choose
**Wear**. Your character wears its colored skirt, bow, and pearl trim; other
players see the dress too. **Wear everyday clothes** restores your regular shirt.
Dresses stay in your collection, and changing outfits is free anywhere. You can
own each dress once. Change out of a dress before selling it at the resale shop.
Dresses cannot be unpacked as home decorations.

`src/content/costumes.ts` holds the catalog and ownership validation.
`src/game/dressArt.ts` draws worn dresses, while `src/DressPreview.tsx` draws the
matching menu pictures. The optional character `outfitId` preserves old saves;
wearing checks membership and ownership with the normal atomic retry receipts.
Run `node scripts/costume-check.mjs` against the isolated development preview.
