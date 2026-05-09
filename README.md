# Hothouse Flasher

A browser-based firmware flasher for the [Cleveland Music Co. Hothouse](https://clevelandmusicco.com) pedal. Flash firmware to your Hothouse over USB — no software installation required.

If you're here simply to flash stuff to your pedal, then [go right to the app](https://clevelandmusicco.github.io/HothouseFlasher)! You're probably not interested in running the code behind this web app ...

... but if you _are_ interested, read on.

---

## Browser Requirements

WebUSB is required. Use a **Chromium-based desktop browser**:

- Google Chrome (recommended)
- Microsoft Edge
- Brave, Opera, and other Chromium forks (these are spotty, at best)

**Not supported:** Firefox, Safari, iOS browsers, or any mobile browser.

The app must be served over **HTTPS**. The GitHub Pages deployment satisfies this automatically. For local development, Vite's dev server uses HTTP on localhost, which browsers treat as a secure context.

Also note that I do not have Windows or Mac machines on which to test. I have only ever tested a local dev setup on Linux.

---

## Putting Your Hothouse Into DFU Mode

1. Connect your Hothouse to your computer via USB.
2. Hold the **BOOT** button on your Hothouse.
3. While holding BOOT, press and release the **RESET** button.
4. Release the BOOT button.

The Hothouse will appear as `STM Device in DFU Mode` (`0483:df11`) on your system.

---

## Windows Driver Setup (Zadig)

On Windows, Chrome cannot access the DFU device until you install the WinUSB driver. You only need to do this once.

1. Connect the Hothouse via USBP and put it in DFU mode.
2. Download [Zadig](https://zadig.akeo.ie/) and open it.
3. Find the device — usually listed as **"DFU in FS Mode"** or **"STM32 BOOTLOADER"**.
4. Select **WinUSB** as the target driver.
5. Click **Install Driver** (or **Replace Driver**).
6. Return to the browser and click **Connect Hothouse**.

---

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome. The app loads firmware from `public/firmware-manifest.json` and serves `.bin` files from `public/firmware/`. Both are seeded with the current release for local development.

> **Note:** To test actual flashing (and anything beyond the first app state) locally, you need a physical Hothouse in DFU mode connected via USB. The app runs at `http://localhost:5173` — Chrome treats localhost as a secure context, so WebUSB works.

---

## Building

```bash
npm run build
```

Output goes to `dist/`. Preview the production build with:

```bash
npm run preview
```

---

## Firmware Discovery

Firmware is served from a static manifest generated at build time. The CI workflow:

1. Queries the latest release from `clevelandmusicco/HothouseExamples` via the GitHub API.
2. Downloads all `.bin` release assets into `public/firmware/`.
3. Generates `public/firmware-manifest.json` with names, filenames, and local paths.
4. Builds the Vite app (which copies `public/` into `dist/`).
5. Deploys `dist/` to GitHub Pages.

At runtime, the browser fetches `/firmware-manifest.json` and `/firmware/<name>.bin` from the same origin. No GitHub API calls happen in the browser.

To regenerate the manifest locally (requires internet access):

```bash
npm run generate-manifest
```

---

## Project Structure

```bash
src/
  main.ts              Entry point; mounts layout skeleton
  app.ts               State machine orchestration
  styles.css           All styles (brand tokens, layout, components)
  firmware/
    types.ts           FirmwareManifest, FirmwareEntry types
    manifest.ts        Fetch and parse firmware-manifest.json
  dfu/
    types.ts           FirmwareFlasher interface, DeviceInfo, USB filters
    flasher.ts         WebUSB + DfuSe implementation (wraps 'dfu' package)
  ui/
    state.ts           AppState union type + AppStateManager
    render.ts          DOM rendering for each app state
    messages.ts        All user-facing strings
scripts/
  generate-manifest.ts CI script: fetch release, download .bins, write manifest
public/
  firmware-manifest.json  Seeded manifest (overwritten by CI)
  firmware/               .bin files (populated by CI; empty in fresh clone)
.github/workflows/
  pages.yml            Build + generate manifest + deploy workflow
```

---

## Known Limitations (v1)

- **Chromium-based desktop browsers only.** WebUSB is not available in Firefox, Safari, or any mobile browser.
- **Windows requires Zadig driver setup.** This is a one-time step but can trip up new users.
- **Internal flash only.** QSPI/external flash is not supported.
- **No firmware checksums.** Binaries are served as-is from the official release.
- **Local development requires seeded `.bin` files.** Run `npm run generate-manifest` once to populate `public/firmware/` for full local testing.
