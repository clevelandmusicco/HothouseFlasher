import type { AppState } from './state.js';
import type { FirmwareEntry, FirmwareManifest } from '../firmware/types.js';
import { MSG } from './messages.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function el(tag: string, attrs: Record<string, string> = {}, ...children: (string | Node)[]): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') node.appendChild(document.createTextNode(child));
    else node.appendChild(child);
  }
  return node;
}

function ol(items: readonly string[], className = 'steps'): HTMLElement {
  const list = document.createElement('ol');
  list.className = className;
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  }
  return list;
}

function releaseStrip(manifest: FirmwareManifest): HTMLElement {
  const strip = el('div', { className: 'release-strip' });
  strip.appendChild(document.createTextNode(`${MSG.RELEASE_LABEL}: `));
  const link = el('a', { href: manifest.release.url, target: '_blank', rel: 'noopener' }, manifest.release.name);
  strip.appendChild(link);
  return strip;
}

function dfuModeCard(): HTMLElement {
  const card = el('div', { className: 'card mt-2' });
  card.appendChild(el('h2', { className: 'section-subheading' }, MSG.DFU_MODE_HEADING));

  card.appendChild(el('p', { className: 'text-sm fw-600 mt-1' }, MSG.DFU_QUICK_LABEL));
  card.appendChild(el('p', { className: 'text-sm text-muted' }, MSG.DFU_QUICK_INTRO));
  card.appendChild(ol(MSG.DFU_QUICK_STEPS, 'steps mt-1'));

  card.appendChild(el('p', { className: 'text-sm fw-600 mt-2' }, MSG.DFU_STANDARD_LABEL));
  card.appendChild(el('p', { className: 'text-sm text-muted' }, MSG.DFU_STANDARD_INTRO));
  card.appendChild(ol(MSG.DFU_STANDARD_STEPS, 'steps mt-1'));

  return card;
}

function windowsTroubleshooting(): HTMLElement {
  const details = document.createElement('details');
  details.className = 'troubleshoot';
  const summary = document.createElement('summary');
  summary.textContent = MSG.WINDOWS_HEADING;
  details.appendChild(summary);

  const body = el('div', { className: 'troubleshoot-body' });
  body.appendChild(el('p', { className: 'mt-1' }, MSG.WINDOWS_INTRO));
  body.appendChild(ol(MSG.WINDOWS_STEPS));
  body.appendChild(el('p', { className: 'mt-2 text-sm text-muted' }, MSG.WINDOWS_NOTE));

  const zadigLink = document.createElement('p');
  zadigLink.className = 'mt-1 text-sm';
  zadigLink.appendChild(document.createTextNode('Download Zadig: '));
  zadigLink.appendChild(el('a', { href: MSG.ZADIG_URL, target: '_blank', rel: 'noopener' }, MSG.ZADIG_URL));
  body.appendChild(zadigLink);

  details.appendChild(body);
  return details;
}

// ── State renderers ────────────────────────────────────────────────────────

export type RenderCallbacks = {
  onConnect: () => void;
  onSelectFirmware: (entry: FirmwareEntry) => void;
  onFlash: () => void;
  onFlashAnother: () => void;
  onRetry: () => void;
  onDisconnect: () => void;
};

export function renderState(state: AppState, callbacks: RenderCallbacks): HTMLElement {
  const wrap = document.createElement('div');

  switch (state.id) {
    case 'CHECKING_BROWSER':
      wrap.appendChild(renderChecking());
      break;
    case 'UNSUPPORTED_BROWSER':
      wrap.appendChild(renderUnsupported(state.reason));
      break;
    case 'LOADING_MANIFEST':
      wrap.appendChild(renderLoading());
      break;
    case 'MANIFEST_ERROR':
      wrap.appendChild(renderManifestError(state.message, callbacks.onRetry));
      break;
    case 'IDLE':
      wrap.appendChild(renderIdle(state.manifest, callbacks.onConnect));
      break;
    case 'CONNECTING':
      wrap.appendChild(renderConnecting(state.manifest));
      break;
    case 'CONNECT_CANCELLED':
      wrap.appendChild(renderConnectCancelled(state.manifest, callbacks.onConnect));
      break;
    case 'CONNECT_ERROR':
      wrap.appendChild(renderConnectError(state.manifest, state.message, callbacks.onConnect));
      break;
    case 'CONNECTED':
      wrap.appendChild(renderConnected(state.manifest, state.device, null, callbacks));
      break;
    case 'FIRMWARE_SELECTED':
      wrap.appendChild(renderConnected(state.manifest, state.device, state.firmware, callbacks));
      break;
    case 'FLASHING':
      wrap.appendChild(renderFlashing(state.firmware, state.percent));
      break;
    case 'FLASH_SUCCESS':
      wrap.appendChild(renderSuccess(state.firmware, callbacks.onFlashAnother));
      break;
    case 'FLASH_ERROR':
      wrap.appendChild(renderFlashError(state.firmware, state.message, callbacks.onFlashAnother));
      break;
  }

  return wrap;
}

function renderChecking(): HTMLElement {
  const div = el('div', { className: 'card' });
  const row = el('div', { style: 'display:flex;align-items:center;gap:0.75rem' });
  row.appendChild(el('span', { className: 'spinner' }));
  row.appendChild(document.createTextNode(MSG.CHECKING_BROWSER));
  div.appendChild(row);
  return div;
}

function renderUnsupported(reason: string): HTMLElement {
  const div = el('div', { className: 'card card--error' });
  div.appendChild(el('h2', { className: 'section-heading text-error' }, MSG.UNSUPPORTED_TITLE));
  div.appendChild(el('p', { className: 'mt-1' }, reason));
  div.appendChild(el('p', { className: 'mt-2' }, MSG.SUPPORTED_BROWSERS));
  return div;
}

function renderLoading(): HTMLElement {
  const div = el('div', { className: 'card' });
  const row = el('div', { style: 'display:flex;align-items:center;gap:0.75rem' });
  row.appendChild(el('span', { className: 'spinner' }));
  row.appendChild(document.createTextNode(MSG.LOADING_MANIFEST));
  div.appendChild(row);
  return div;
}

function renderManifestError(message: string, onRetry: () => void): HTMLElement {
  const div = el('div', { className: 'card card--error' });
  div.appendChild(el('h2', { className: 'section-heading text-error' }, MSG.MANIFEST_ERROR_TITLE));
  div.appendChild(el('p', { className: 'mt-1 text-sm' }, message));
  const btn = el('button', { className: 'btn btn-secondary mt-2' }, MSG.MANIFEST_ERROR_RETRY);
  (btn as HTMLButtonElement).type = 'button';
  btn.addEventListener('click', onRetry);
  div.appendChild(btn);
  return div;
}

function renderIdle(manifest: FirmwareManifest, onConnect: () => void): HTMLElement {
  const frag = document.createDocumentFragment();

  const intro = el('div', {});
  intro.appendChild(el('h1', { className: 'page-heading' }, MSG.IDLE_HEADING));
  const introPara = el('p', { className: 'mt-1' });
  introPara.appendChild(document.createTextNode(MSG.IDLE_INTRO_BEFORE));
  introPara.appendChild(el('a', { href: MSG.REPO_URL, target: '_blank', rel: 'noopener' }, MSG.IDLE_INTRO_LINK));
  introPara.appendChild(document.createTextNode(MSG.IDLE_INTRO_AFTER));
  intro.appendChild(introPara);
  frag.appendChild(intro);

  frag.appendChild(dfuModeCard());

  const connectCard = el('div', { className: 'card mt-2' });
  connectCard.appendChild(releaseStrip(manifest));
  const btn = el('button', { className: 'btn btn-primary btn-lg' }, MSG.CONNECT_BUTTON);
  (btn as HTMLButtonElement).type = 'button';
  btn.addEventListener('click', onConnect);
  connectCard.appendChild(btn);
  frag.appendChild(connectCard);

  frag.appendChild(windowsTroubleshooting());

  const wrap = document.createElement('div');
  wrap.appendChild(frag);
  return wrap;
}

function renderConnecting(manifest: FirmwareManifest): HTMLElement {
  const card = el('div', { className: 'card' });
  card.appendChild(releaseStrip(manifest));
  const row = el('div', { style: 'display:flex;align-items:center;gap:0.75rem;margin-top:0.5rem' });
  row.appendChild(el('span', { className: 'spinner' }));
  row.appendChild(document.createTextNode(MSG.CONNECTING));
  card.appendChild(row);
  return card;
}

function renderConnectCancelled(_manifest: FirmwareManifest, onConnect: () => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.appendChild(dfuModeCard());

  const card = el('div', { className: 'card card--warning mt-2' });
  card.appendChild(el('p', { className: 'fw-600' }, MSG.CONNECT_CANCELLED));
  card.appendChild(el('p', { className: 'mt-1 text-sm' }, MSG.CONNECT_CANCELLED_DETAIL));

  const btn = el('button', { className: 'btn btn-primary btn-lg mt-2' }, MSG.CONNECT_BUTTON);
  (btn as HTMLButtonElement).type = 'button';
  btn.addEventListener('click', onConnect);
  card.appendChild(btn);
  wrap.appendChild(card);
  wrap.appendChild(windowsTroubleshooting());
  return wrap;
}

function renderConnectError(_manifest: FirmwareManifest, message: string, onConnect: () => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.appendChild(dfuModeCard());

  const card = el('div', { className: 'card card--error mt-2' });
  card.appendChild(el('h2', { className: 'section-subheading text-error' }, MSG.CONNECT_ERROR_TITLE));
  card.appendChild(el('p', { className: 'mt-1 text-sm' }, message));

  const btn = el('button', { className: 'btn btn-primary btn-lg mt-2' }, MSG.CONNECT_BUTTON);
  (btn as HTMLButtonElement).type = 'button';
  btn.addEventListener('click', onConnect);
  card.appendChild(btn);
  wrap.appendChild(card);
  wrap.appendChild(windowsTroubleshooting());
  return wrap;
}

function renderConnected(
  manifest: FirmwareManifest,
  device: { manufacturerName?: string; productName?: string; serialNumber?: string },
  selectedFirmware: FirmwareEntry | null,
  callbacks: RenderCallbacks
): HTMLElement {
  const wrap = document.createElement('div');

  // Device badge row
  const badgeRow = el('div', { style: 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.25rem' });
  const badge = el('span', { className: 'device-badge' }, device.productName ?? 'Hothouse (DFU)');
  badgeRow.appendChild(badge);
  const disconnectBtn = el('button', { className: 'btn btn-secondary btn-sm' }, MSG.DISCONNECT_BUTTON);
  (disconnectBtn as HTMLButtonElement).type = 'button';
  disconnectBtn.addEventListener('click', callbacks.onDisconnect);
  badgeRow.appendChild(disconnectBtn);
  wrap.appendChild(badgeRow);

  // Firmware list
  const listCard = el('div', { className: 'card' });
  listCard.appendChild(releaseStrip(manifest));
  listCard.appendChild(el('h2', { className: 'section-subheading' }, MSG.FIRMWARE_LIST_HEADING));

  const list = el('div', { className: 'firmware-list' });
  for (const entry of manifest.firmware) {
    const item = el('div', { className: 'firmware-item' + (selectedFirmware?.filename === entry.filename ? ' selected' : '') });
    const nameEl = el('span', { className: 'firmware-item__name' }, entry.name);
    const fnEl = el('span', { className: 'firmware-item__filename' }, entry.filename);
    item.appendChild(nameEl);
    item.appendChild(fnEl);
    item.addEventListener('click', () => callbacks.onSelectFirmware(entry));
    list.appendChild(item);
  }
  listCard.appendChild(list);
  wrap.appendChild(listCard);

  // Flash action row
  if (selectedFirmware) {
    const actionCard = el('div', { className: 'card mt-2' });
    actionCard.appendChild(el('p', { className: 'text-sm text-muted' }, MSG.SELECTED_LABEL));
    actionCard.appendChild(el('p', { className: 'fw-600' }, selectedFirmware.name));

    const flashBtn = el('button', { className: 'btn btn-primary btn-lg mt-2' }, MSG.FLASH_BUTTON);
    (flashBtn as HTMLButtonElement).type = 'button';
    flashBtn.addEventListener('click', callbacks.onFlash);
    actionCard.appendChild(flashBtn);
    wrap.appendChild(actionCard);
  }

  return wrap;
}

function renderFlashing(firmware: FirmwareEntry, percent: number): HTMLElement {
  const card = el('div', { className: 'card' });
  card.appendChild(el('h2', { className: 'section-heading' }, MSG.FLASHING_HEADING));
  card.appendChild(el('p', { className: 'mt-1' }, MSG.FLASHING_DETAIL(firmware.name)));

  const barWrap = el('div', { className: 'progress-bar-wrap' });
  const fill = el('div', { className: 'progress-bar-fill' });
  fill.style.width = `${percent}%`;
  barWrap.appendChild(fill);
  card.appendChild(barWrap);

  card.appendChild(el('p', { className: 'progress-label' }, `${Math.round(percent)}%`));
  card.appendChild(el('p', { className: 'helper-text mt-2' }, MSG.FLASHING_DO_NOT_DISCONNECT));
  return card;
}

function renderSuccess(firmware: FirmwareEntry, onFlashAnother: () => void): HTMLElement {
  const card = el('div', { className: 'card card--success' });
  card.appendChild(el('h2', { className: 'section-heading text-success' }, MSG.SUCCESS_HEADING));
  card.appendChild(el('p', { className: 'mt-1' }, MSG.SUCCESS_DETAIL(firmware.name)));

  if (firmware.readmeUrl) {
    const p = el('p', { className: 'mt-2' });
    p.appendChild(el('a', { href: firmware.readmeUrl, target: '_blank', rel: 'noopener' }, MSG.SOURCE_URL));
    card.appendChild(p);
  }

  card.appendChild(el('p', { className: 'mt-2' }, MSG.SUCCESS_RESET_INSTRUCTION));

  const btn = el('button', { className: 'btn btn-secondary btn-lg mt-3' }, MSG.FLASH_ANOTHER);
  (btn as HTMLButtonElement).type = 'button';
  btn.addEventListener('click', onFlashAnother);
  card.appendChild(btn);
  return card;
}

function renderFlashError(_firmware: FirmwareEntry, message: string, onTryAgain: () => void): HTMLElement {
  const card = el('div', { className: 'card card--error' });
  card.appendChild(el('h2', { className: 'section-heading text-error' }, MSG.FLASH_ERROR_TITLE));
  card.appendChild(el('p', { className: 'mt-1' }, message));
  card.appendChild(el('p', { className: 'mt-1 text-sm text-muted' }, MSG.FLASH_ERROR_DETAIL));

  const btn = el('button', { className: 'btn btn-primary btn-lg mt-2' }, MSG.TRY_AGAIN);
  (btn as HTMLButtonElement).type = 'button';
  btn.addEventListener('click', onTryAgain);
  card.appendChild(btn);
  return card;
}
