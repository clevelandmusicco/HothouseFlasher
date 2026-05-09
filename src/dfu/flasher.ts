/// <reference types="@types/w3c-web-usb" />
import { WebDFU } from 'dfu';
import type { FirmwareFlasher, DeviceInfo, FlashOptions } from './types.js';
import { DAISY_USB_FILTERS } from './types.js';

// Daisy Seed internal flash base address (STM32H750)
const DAISY_INTERNAL_FLASH_ADDRESS = 0x08000000;

// DFU transfer size — use device-reported value, fall back to 2048
const DEFAULT_TRANSFER_SIZE = 2048;

export class DaisyFlasher implements FirmwareFlasher {
  private dfu: WebDFU | null = null;

  private async openDevice(device: USBDevice): Promise<DeviceInfo> {
    const dfu = new WebDFU(device, { forceInterfacesName: true }, {
      info: (_msg: string) => {},
      warning: (_msg: string) => {},
      progress: (_done: number, _total?: number) => {},
    });

    await dfu.init();

    if (dfu.interfaces.length === 0) {
      throw new Error('No DFU interfaces found on the connected device. Make sure your Hothouse is in DFU mode.');
    }

    await dfu.connect(0);
    dfu.dfuseStartAddress = DAISY_INTERNAL_FLASH_ADDRESS;
    this.dfu = dfu;

    return {
      manufacturerName: device.manufacturerName ?? undefined,
      productName: device.productName ?? undefined,
      serialNumber: device.serialNumber ?? undefined,
    };
  }

  async connect(): Promise<DeviceInfo> {
    const device = await navigator.usb.requestDevice({ filters: [...DAISY_USB_FILTERS] });
    return this.openDevice(device);
  }

  async reconnect(): Promise<DeviceInfo> {
    const devices = await navigator.usb.getDevices();
    const device = devices.find(d =>
      DAISY_USB_FILTERS.some(f => f.vendorId === d.vendorId && f.productId === d.productId)
    );
    if (!device) {
      throw new Error('Device not found. Put your Hothouse in DFU mode and try connecting again.');
    }
    return this.openDevice(device);
  }

  async flash(binary: ArrayBuffer, options: FlashOptions): Promise<void> {
    if (!this.dfu) {
      throw new Error('Not connected. Call connect() before flash().');
    }

    const xferSize = this.dfu.properties?.TransferSize ?? DEFAULT_TRANSFER_SIZE;

    // manifestationTolerant=false: device will not auto-reset after the manifest phase.
    // The user must press RESET manually — this is the documented Daisy Seed DFU flow.
    const process = this.dfu.write(xferSize, binary, false);

    await new Promise<void>((resolve, reject) => {
      let eraseTotal = 0;
      let eraseBytes = 0;
      let writeComplete = false;

      process.events.on('erase/start', () => {
        options.onProgress(0);
      });

      process.events.on('erase/process', (done: number, total?: number) => {
        eraseBytes = done;
        eraseTotal = total ?? done;
        // Erase counts as the first 40% of total progress
        const progress = eraseTotal > 0 ? (eraseBytes / eraseTotal) * 40 : 0;
        options.onProgress(Math.min(progress, 40));
      });

      process.events.on('write/process', (bytesSent: number, expectedSize: number) => {
        // Write counts as the remaining 60% of total progress (40–100%)
        const progress = expectedSize > 0 ? 40 + (bytesSent / expectedSize) * 60 : 40;
        options.onProgress(Math.min(progress, 99));
        if (bytesSent >= expectedSize) writeComplete = true;
      });

      process.events.on('end', () => {
        options.onProgress(100);
        resolve();
      });

      process.events.on('error', (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        // The STM32H750 stalls the GETSTATUS poll after manifestation (DFU Error 74) because
        // the device resets before the host can read status. This is expected and safe to
        // ignore once the write phase has completed — dfu-util exhibits the same behavior.
        if (writeComplete && message.toLowerCase().includes('stall')) {
          options.onProgress(100);
          resolve();
          return;
        }
        reject(new Error(`Flash failed: ${message}`));
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.dfu) {
      try {
        await this.dfu.close();
      } catch {
        // Ignore errors during cleanup — device may have already disconnected
      }
      this.dfu = null;
    }
  }
}

/** Check whether WebUSB is available in this browser context */
export function isWebUSBSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/** Check whether the page is running in a secure context (required for WebUSB) */
export function isSecureContext(): boolean {
  return window.isSecureContext;
}
