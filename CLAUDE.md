# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server at http://localhost:5173
npm run build            # Type-check (tsc --noEmit) then Vite build → dist/
npm run preview          # Serve the dist/ build locally
npm run generate-manifest  # Fetch latest HothouseExamples release + write public/firmware-manifest.json
```

There is no test suite and no linter configured.

For local development with actual firmware files, run `npm run generate-manifest` once to populate `public/firmware/` (requires internet access). Without it, the manifest loads but firmware downloads will 404.

## Architecture

This is a single-page TypeScript app (Vite + no framework) that flashes firmware to a Daisy Seed-based guitar pedal via WebUSB. It requires a Chromium desktop browser and HTTPS (or localhost).

**Data flow at runtime:**
1. Browser fetches `/firmware-manifest.json` (static JSON, generated at CI build time).
2. User selects a firmware entry; on flash, browser fetches the `.bin` from `/firmware/<name>.bin`.
3. The binary is written to the STM32H750's internal flash via the `dfu` npm package (WebDFU/DfuSe protocol) over WebUSB.

**State machine (`src/ui/state.ts` → `src/app.ts`):**

`AppState` is a discriminated union of 13 states. `AppStateManager` holds current state and notifies subscribers on `transition()`. `app.ts` wires all async handlers (connect, flash, etc.) to state transitions and re-renders after each one.

State flow (happy path): `CHECKING_BROWSER` → `LOADING_MANIFEST` → `IDLE` → `CONNECTING` → `CONNECTED` → `FIRMWARE_SELECTED` → `FLASHING` → `FLASH_SUCCESS`.

**Module responsibilities:**

| Path | Role |
|------|------|
| `src/main.ts` | Entry point; mounts layout and calls `initApp()` |
| `src/app.ts` | All event handlers and the boot sequence; owns `AppStateManager` and `DaisyFlasher` |
| `src/ui/state.ts` | `AppState` union type + `AppStateManager` class |
| `src/ui/render.ts` | Pure DOM rendering per state; returns a `DocumentFragment` |
| `src/ui/messages.ts` | All user-visible strings in one place |
| `src/firmware/types.ts` | `FirmwareManifest`, `FirmwareEntry`, `FirmwareRelease` types |
| `src/firmware/manifest.ts` | Fetches and parses `firmware-manifest.json` at runtime |
| `src/dfu/types.ts` | `FirmwareFlasher` interface, `DeviceInfo`, `DAISY_USB_FILTERS` |
| `src/dfu/flasher.ts` | `DaisyFlasher`: wraps the `dfu` npm package; maps erase (0–40%) + write (40–100%) to progress |
| `scripts/generate-manifest.ts` | Node script (run via `tsx`): hits GitHub API, downloads `.bin` files, writes manifest |

**DFU quirk:** The STM32H750 stalls the GETSTATUS poll after manifestation with DFU Error 74. `flasher.ts` treats a stall error after `writeComplete` as success (matches `dfu-util` behavior). After flashing, the user must press RESET manually — the device does not auto-reset.

## CI / Deployment

`.github/workflows/pages.yml` runs on push to `main` and on a daily cron (06:00 UTC). It runs `generate-manifest` → `build` → deploys `dist/` to GitHub Pages. The daily schedule keeps firmware current without requiring a code push.

The `base: './'` in `vite.config.ts` is required for correct asset paths on GitHub Pages.
