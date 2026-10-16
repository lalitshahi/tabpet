# Store listing (Chrome, Edge, Opera, Firefox, Safari)

**Name:** Tab Pet

**Summary (132 chars max):**
A tiny pet that eats the tabs you forgot. Every tab is saved in its belly, so nothing is lost. Hatch yours.

**Category:** Productivity (Chrome, Edge, Opera) · Tabs (Firefox)

**Description:**

You have 87 tabs open. 52 of them you haven't looked at in a week. You keep them because closing feels like losing something.

Tab Pet fixes that with a pet.

Pick an egg and hatch one of 24 cute and fantasy pets: cats, bunnies, ghosts, baby dragons, unicorns, a star whale. Some are rare. A few are shiny.

Your pet looks around and tells you your tab personality. Are you a Hoarder, a Ghost Collector or a Chaos Goblin?

Then feed it. It eats the tabs you forgot, the duplicates, or everything at once if you declare tab bankruptcy. It never eats pinned tabs, tabs playing sound, tab groups or the tab you're on. And it shows how much memory you got back.

Nothing is lost. Every tab goes into your pet's belly, where you can search it and bring it back in one click.

Turn on autopilot and it snacks on forgotten tabs every hour, like Arc's auto-archive.

Keep your tabs tidy and your pet grows from baby to grown, and you earn new eggs to hatch.

Every week, share a card: "Mochi ate 52 tabs, about 1.9 GB back."

Private by design:
• No account, no server, no tracking
• Makes no network requests at all
• At install it only sees how many tabs you have and when you last used them
• It asks before it reads tab titles, and only so it can remember what it ate

Free. Built in public by one developer.

**Screenshots (1280×800):** egg picker, hatch reveal (rare pet), tab autopsy, "ate 52 tabs, 1.9 GB back", belly search, share card.

**Single purpose (for review):** Closes tabs the user hasn't used recently and keeps a searchable list so they can be reopened, presented as a virtual pet.

**Permission justifications:**
- `storage`: saves your pets, settings and the list of eaten tabs on your device.
- `alarms`: an hourly check for tidy days and, if you turn it on, autopilot.
- `system.memory` (Chromium only): reads free memory before and after eating to show the memory you got back. No warning is shown for this permission.
- `tabs` (optional, requested when you first feed your pet): reads tab titles and links so eaten tabs can be listed, searched and reopened, and so duplicates can be found.

**Data usage disclosure:** Does not collect or transmit any user data. Tab titles and links are stored locally and never leave the device.

**Firefox:** `data_collection_permissions: none` is declared in the manifest.
