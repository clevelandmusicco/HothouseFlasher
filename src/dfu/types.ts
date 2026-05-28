export interface DeviceInfo {
  manufacturerName: string | undefined;
  productName: string | undefined;
  serialNumber: string | undefined;
}

export interface FlashOptions {
  /** Called repeatedly during flash with 0–100 progress value */
  onProgress: (percent: number) => void;
  /** Called when the flash phase changes between erase and write */
  onPhase?: (phase: 'erasing' | 'writing') => void;
}

export interface FirmwareFlasher {
  connect(): Promise<DeviceInfo>;
  reconnect(): Promise<DeviceInfo>;
  flash(binary: ArrayBuffer, options: FlashOptions): Promise<void>;
  disconnect(): Promise<void>;
}

/** USB vendor/product IDs for STM32 in DFU mode (the Daisy Seed).
 *  Typed as a plain object array to avoid a hard dependency on the w3c-web-usb
 *  ambient type in files that don't import from 'dfu'. */
export const DAISY_USB_FILTERS = [
  { vendorId: 0x0483, productId: 0xdf11 },
] as const;
