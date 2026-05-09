import { AppStateManager } from './ui/state.js';
import { renderState } from './ui/render.js';
import type { RenderCallbacks } from './ui/render.js';
import { loadManifest } from './firmware/manifest.js';
import type { FirmwareManifest } from './firmware/types.js';
import type { FirmwareEntry } from './firmware/types.js';
import { DaisyFlasher, isWebUSBSupported, isSecureContext } from './dfu/flasher.js';
import { MSG } from './ui/messages.js';

export function initApp(root: HTMLElement): void {
  const stateManager = new AppStateManager();
  const flasher = new DaisyFlasher();

  function render(): void {
    const view = renderState(stateManager.current, makeCallbacks());
    root.innerHTML = '';
    root.appendChild(view);
    const list = root.querySelector('.firmware-list') as HTMLElement | null;
    const selected = list?.querySelector('.firmware-item.selected') as HTMLElement | null;
    if (list && selected) {
      const itemTop = selected.offsetTop;
      const itemBottom = itemTop + selected.offsetHeight;
      if (itemTop < list.scrollTop) {
        list.scrollTo({ top: itemTop });
      } else if (itemBottom > list.scrollTop + list.clientHeight) {
        list.scrollTo({ top: itemBottom - list.clientHeight });
      }
    }
  }

  stateManager.subscribe(render);

  function makeCallbacks(): RenderCallbacks {
    return {
      onConnect: handleConnect,
      onSelectFirmware: handleSelectFirmware,
      onFlash: handleFlash,
      onFlashAnother: handleReset,
      onRetry: handleRetry,
      onDisconnect: handleDisconnect,
    };
  }

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleConnect(): Promise<void> {
    const s = stateManager.current;
    if (s.id !== 'IDLE' && s.id !== 'CONNECT_CANCELLED' && s.id !== 'CONNECT_ERROR' && s.id !== 'CONNECTED') return;
    // All four states above carry a `manifest` field
    const manifest = (s as { manifest: FirmwareManifest }).manifest;

    stateManager.transition({ id: 'CONNECTING', manifest });
    try {
      const device = await flasher.connect();
      stateManager.transition({ id: 'CONNECTED', manifest, device });
    } catch (err) {
      if (isDismissed(err)) {
        stateManager.transition({ id: 'CONNECT_CANCELLED', manifest });
      } else {
        stateManager.transition({ id: 'CONNECT_ERROR', manifest, message: errorMessage(err) });
      }
    }
  }

  function handleSelectFirmware(entry: FirmwareEntry): void {
    const s = stateManager.current;
    if (s.id !== 'CONNECTED' && s.id !== 'FIRMWARE_SELECTED') return;
    stateManager.transition({ id: 'FIRMWARE_SELECTED', manifest: s.manifest, device: s.device, firmware: entry });
  }

  async function handleFlash(): Promise<void> {
    const s = stateManager.current;
    if (s.id !== 'FIRMWARE_SELECTED') return;
    const { manifest, device, firmware } = s;

    stateManager.transition({ id: 'FLASHING', manifest, device, firmware, percent: 0 });

    let binary: ArrayBuffer;
    try {
      binary = await fetchFirmware(firmware.localPath);
    } catch (err) {
      stateManager.transition({
        id: 'FLASH_ERROR',
        manifest,
        device,
        firmware,
        message: `Could not download firmware: ${errorMessage(err)}`,
      });
      return;
    }

    try {
      await flasher.flash(binary, {
        onProgress: (percent) => {
          stateManager.transition({ id: 'FLASHING', manifest, device, firmware, percent });
        },
      });
      stateManager.transition({ id: 'FLASH_SUCCESS', manifest, device, firmware });
    } catch (err) {
      stateManager.transition({
        id: 'FLASH_ERROR',
        manifest,
        device,
        firmware,
        message: errorMessage(err),
      });
    }
  }

  async function handleReset(): Promise<void> {
    const s = stateManager.current;
    if (s.id !== 'FLASH_SUCCESS' && s.id !== 'FLASH_ERROR') return;
    const { manifest } = s;

    await flasher.disconnect();
    stateManager.transition({ id: 'CONNECTING', manifest });
    try {
      const device = await flasher.reconnect();
      stateManager.transition({ id: 'CONNECTED', manifest, device });
    } catch {
      stateManager.transition({ id: 'IDLE', manifest });
    }
  }

  async function handleRetry(): Promise<void> {
    await startManifestLoad();
  }

  async function handleDisconnect(): Promise<void> {
    await flasher.disconnect();
    const s = stateManager.current;
    if ('manifest' in s) {
      stateManager.transition({ id: 'IDLE', manifest: (s as { manifest: FirmwareManifest }).manifest });
    }
  }

  // ── Boot sequence ────────────────────────────────────────────────────────

  async function startManifestLoad(): Promise<void> {
    stateManager.transition({ id: 'LOADING_MANIFEST' });
    try {
      const manifest = await loadManifest();
      stateManager.transition({ id: 'IDLE', manifest });
    } catch (err) {
      stateManager.transition({ id: 'MANIFEST_ERROR', message: errorMessage(err) });
    }
  }

  function start(): void {
    render(); // show CHECKING_BROWSER immediately

    if (!isSecureContext()) {
      stateManager.transition({ id: 'UNSUPPORTED_BROWSER', reason: MSG.UNSUPPORTED_INSECURE });
      return;
    }
    if (!isWebUSBSupported()) {
      stateManager.transition({ id: 'UNSUPPORTED_BROWSER', reason: MSG.UNSUPPORTED_WEBUSB });
      return;
    }

    void startManifestLoad();
  }

  start();
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchFirmware(localPath: string): Promise<ArrayBuffer> {
  const resp = await fetch(localPath);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} fetching ${localPath}`);
  }
  return resp.arrayBuffer();
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** navigator.usb.requestDevice() rejects with a DOMException named NotFoundError when the user cancels */
function isDismissed(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'NotFoundError';
}
