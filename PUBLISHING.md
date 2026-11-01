# Publishing Tab Pet

Build the uploads first:

```bash
npm test && npm run zip
# dist/tab-pet-chromium-<version>.zip  -> Chrome, Edge, Opera
# dist/tab-pet-firefox-<version>.zip   -> Firefox
# dist/safari/                          -> Safari (needs a Mac)
```

Everything you paste into the stores (name, summary, description, permission reasons, privacy answers) is in [`STORE.md`](STORE.md).

You need, once, for every store:

- **Homepage:** https://indiecoderlab.vercel.app/tab-pet
- **Privacy policy:** https://indiecoderlab.vercel.app/tab-pet-privacy
- **Support:** https://github.com/lalitshahi/tab-pet/issues
- **Icon:** `icons/icon-128.png`
- **Screenshots:** 1280×800 PNGs (popup, belly, share card). Take them from the real extension once it's loaded.
- **Small promo tile (Chrome):** 440×280 PNG

Order that works best: Chrome first (biggest audience, sets the listing), then Edge and Firefox the same day, Opera after, Safari last.

## 1. Chrome Web Store

1. Go to the Chrome Web Store Developer Dashboard (chrome.google.com/webstore/devconsole), sign in with the Google account you want to publish under, and pay the one-time US$5 registration fee.
2. Fill in the account page: publisher name (IndieCoder Lab), contact email, and verify the email.
3. **New item** → upload `tab-pet-chromium-<version>.zip`.
4. **Store listing** tab: description, category Productivity, language English, icon, screenshots, promo tile, homepage and support URLs.
5. **Privacy** tab:
   - Single purpose: copy from STORE.md.
   - Permission justifications for `storage`, `alarms`, `system.memory`, `tabs`: copy from STORE.md.
   - Remote code: **No**.
   - Data usage: tick nothing (it collects no user data), then tick the three certifications.
   - Privacy policy URL.
6. **Distribution** tab: Free, all regions, Public.
7. **Submit for review.** First reviews usually take a few days. Optional permissions like `tabs` can add a little time.

## 2. Microsoft Edge Add-ons

1. Partner Center (partner.microsoft.com) → register for the Microsoft Edge program. Free.
2. **Create new extension** → upload the same `tab-pet-chromium-<version>.zip`.
3. Availability: Public, all markets.
4. Properties: category Productivity, privacy policy URL, website, support.
5. Store listing (English): description, icon, screenshots.
6. Submission options: notes for certification can repeat the single purpose and permission reasons.
7. **Publish.** Review usually takes a few business days.

## 3. Firefox (addons.mozilla.org)

1. Sign in to the Add-on Developer Hub (addons.mozilla.org/developers) with a Firefox account. Free.
2. **Submit a New Add-on** → On this site (listed).
3. Upload `tab-pet-firefox-<version>.zip`. It passes `web-ext lint` with 0 errors.
4. Source code: answer **No**. Nothing is minified or bundled, so Mozilla doesn't need a separate source upload.
5. Listing: name, summary, description, category Tabs, support URL, homepage, privacy policy, licence **GNU Affero General Public License v3.0**.
6. Submit. Firefox listings usually go live within hours to a couple of days.

## 4. Opera Add-ons

1. Opera add-ons developer portal (addons.opera.com/developer). Free.
2. Upload the same `tab-pet-chromium-<version>.zip`, fill in the listing, submit. Opera's review is manual and can take one to a few weeks.

## 5. Safari (Mac, iPhone, iPad)

Needs a Mac with Xcode and the Apple Developer Program (US$99/year).

1. Copy `dist/safari` to the Mac and run:
   `xcrun safari-web-extension-converter dist/safari --app-name "Tab Pet" --bundle-identifier com.indiecoderlab.tabpet`
2. Open the Xcode project it creates. Set your team for signing on both the app and extension targets.
3. Run it once on your Mac and enable it in Safari → Settings → Extensions to check it works.
4. In App Store Connect create the app (macOS, and iOS if you want iPhone and iPad), then **Product → Archive** in Xcode and upload.
5. Fill in the App Store listing (same copy), privacy "Data Not Collected", and submit for review.

## After it's live

- Put each store URL into `STORES` in `src/pages/tab-pet.astro` on the IndieCoder Lab site, so the buttons go straight to the store.
- Take `draft: true` off `src/content/projects/tab-pet.md` so it shows on the lab home page.
- For updates: bump `version` in `manifest.base.json` and `package.json`, `npm run zip`, upload the new zip to each store.
