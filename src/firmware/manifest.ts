import type { FirmwareManifest } from './types.js';

/** Derive a human-readable name from a firmware filename, e.g. "amnesia_delay.bin" → "Amnesia Delay" */
export function deriveName(filename: string): string {
  return filename
    .replace(/\.bin$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function loadManifest(): Promise<FirmwareManifest> {
  const resp = await fetch('./firmware-manifest.json');
  if (!resp.ok) {
    throw new Error(`Failed to load firmware manifest (HTTP ${resp.status})`);
  }
  const data: unknown = await resp.json();
  assertManifest(data);
  return data;
}

function assertManifest(data: unknown): asserts data is FirmwareManifest {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('schemaVersion' in data) ||
    !('firmware' in data) ||
    !Array.isArray((data as { firmware: unknown }).firmware)
  ) {
    throw new Error('firmware-manifest.json is malformed or missing');
  }
}
