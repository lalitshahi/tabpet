# Tab Pet

**Website:** https://indiecoderlab.vercel.app/tab-pet · **Privacy:** https://indiecoderlab.vercel.app/tab-pet-privacy

A tiny pet in your toolbar that eats the tabs you forgot. It saves every one in its belly, so nothing is lost, and shows how much memory you got back. Arc-style auto-archive for every browser.

- **Hatch:** pick one of three eggs (Cozy, Spooky-cute, Mythic) and get one of 24 cute or fantasy pets. Rarity is 70% common, 25% rare, 5% legendary. Any pet can be shiny (1 in 50). You get one free re-hatch in the first day.
- **Tab autopsy:** on first run, your tab count, windows, ghost tabs and oldest tab add up to a personality: Minimalist, Hoarder, Ghost Collector, Chaos Goblin or Researcher.
- **Eat:** ghost tabs (untouched for 7 days by default), duplicates, or everything (tab bankruptcy). Pinned, playing, grouped and currently-viewed tabs are never eaten.
- **Belly:** every eaten tab is searchable and can be brought back.
- **Autopilot:** eats ghost tabs every hour, like Arc's auto-archive.
- **Grows:** baby → teen → grown with XP (1 per tab eaten, 25 per tidy day). A new egg for every 100 tabs eaten or 7 tidy days. Switch pets any time.
- **Toolbar:** the pet's face, with the tab count on a badge coloured by mood.
- **Share cards:** "Mochi ate 52 tabs, about 1.9 GB back" and "My tab personality".
- **Private:** no network requests at all. The `tabs` permission is optional and asked for only when you first feed your pet.

## Browsers

One source, three builds (`npm run build`):

| Build | Browsers | Store | Notes |
|---|---|---|---|
| `dist/chromium` | Chrome, Edge, Brave, Opera, Vivaldi, Arc | Chrome Web Store, Edge Add-ons, Opera Add-ons | Full features, including measured memory (`system.memory`) |
| `dist/firefox` | Firefox (desktop) | addons.mozilla.org | No memory API in Firefox, so it shows tabs eaten instead of GB. Passes `web-ext lint` with 0 warnings. |
| `dist/safari` | Safari on Mac, iPhone, iPad | Mac App Store / App Store | Needs a Mac with Xcode and the Apple Developer account: `xcrun safari-web-extension-converter dist/safari --app-name "Tab Pet"`. No memory number. |

Safari may not expose `tab.lastAccessed`; the background script falls back to when it last saw each tab activated.

## Try it locally

- **Chrome / Edge / Brave:** `npm run build`, open `chrome://extensions` (or `edge://extensions`), turn on Developer mode, **Load unpacked**, pick `dist/chromium`.
- **Firefox:** `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → pick `dist/firefox/manifest.json`.

A tab opens with three eggs. Pick one.

## Develop

```bash
npm test          # pure logic: moods, personalities, ghosts, duplicates, rolls, growth, belly
npm run icons     # re-render icons/ from the pixel art (no dependencies)
npm run build     # dist/chromium, dist/firefox, dist/safari
npm run zip       # also the store uploads: dist/tab-pet-<browser>-<version>.zip
```

| File | Does |
|---|---|
| `src/pets.js` | The 24-pet roster, eggs, and the pixel renderer |
| `src/logic.js` | Pure logic: moods, personalities, ghost and duplicate picking, rolls, growth, tidy days, belly search |
| `src/api.js` | `browser`/`chrome` shim, optional `tabs` permission, memory reading |
| `src/background.js` | Toolbar icon and badge, hourly tick (tidy days, autopilot), eating and restoring |
| `src/popup.*` | Hatch → autopsy → first meal, then the pet, pets, share and settings |
| `src/belly.*` | Search eaten tabs and bring them back |
| `src/card.js` | The two share cards |
| `manifest.base.json` + `scripts/build.mjs` | Per-browser manifests |

## Publishing

Step by step for every store, with the listing copy in [`STORE.md`](STORE.md): see [`PUBLISHING.md`](PUBLISHING.md).

## Contributing

Issues and pull requests are welcome. By sending a pull request you agree that your contribution can be released under the same licence, and that the maintainer may also offer it under other terms (this keeps the store builds possible). If you add a pet, keep it cute or fantasy, 64×48 pixel art, drawn in code in `src/pets.js`.

## Licence

Code: [GNU AGPL v3.0](LICENSE). You can use, change and share it; if you share a changed version, or run it for others, share your source under the same licence.

Font: Nunito, under the SIL Open Font Licence ([`src/fonts/OFL.txt`](src/fonts/OFL.txt)).

"Tab Pet" and the Tab Pet pet characters as a brand are not covered by the code licence. Forks are welcome under a different name.
