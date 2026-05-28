import type { FirmwareEntry, FirmwareManifest } from '../firmware/types.js';
import type { DeviceInfo } from '../dfu/types.js';

export type AppState =
  | { id: 'CHECKING_BROWSER' }
  | { id: 'UNSUPPORTED_BROWSER'; reason: string }
  | { id: 'LOADING_MANIFEST' }
  | { id: 'MANIFEST_ERROR'; message: string }
  | { id: 'IDLE'; manifest: FirmwareManifest }
  | { id: 'CONNECTING'; manifest: FirmwareManifest }
  | { id: 'CONNECT_CANCELLED'; manifest: FirmwareManifest }
  | { id: 'CONNECT_ERROR'; manifest: FirmwareManifest; message: string }
  | { id: 'CONNECTED'; manifest: FirmwareManifest; device: DeviceInfo }
  | { id: 'FIRMWARE_SELECTED'; manifest: FirmwareManifest; device: DeviceInfo; firmware: FirmwareEntry }
  | { id: 'FLASHING'; manifest: FirmwareManifest; device: DeviceInfo; firmware: FirmwareEntry; percent: number; phase: 'erasing' | 'writing' }
  | { id: 'FLASH_SUCCESS'; manifest: FirmwareManifest; device: DeviceInfo; firmware: FirmwareEntry }
  | { id: 'FLASH_ERROR'; manifest: FirmwareManifest; device: DeviceInfo; firmware: FirmwareEntry; message: string };

export type StateId = AppState['id'];

type Listener = (state: AppState) => void;

export class AppStateManager {
  private state: AppState = { id: 'CHECKING_BROWSER' };
  private listeners: Set<Listener> = new Set();

  get current(): AppState {
    return this.state;
  }

  transition(next: AppState): void {
    this.state = next;
    this.listeners.forEach((fn) => fn(next));
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
