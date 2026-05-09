export interface FirmwareEntry {
  name: string;
  filename: string;
  /** Path relative to app root, e.g. "./firmware/amnesia_delay.bin" */
  localPath: string;
  /** Original GitHub release download URL (metadata only; not fetched at runtime) */
  downloadUrl: string;
  /** GitHub tree URL for the example's README, if available */
  readmeUrl?: string;
  target: string;
  flashTarget: 'internal';
}

export interface FirmwareRelease {
  tag: string;
  name: string;
  url: string;
}

export interface FirmwareManifest {
  schemaVersion: 1;
  sourceRepo: string;
  release: FirmwareRelease;
  firmware: FirmwareEntry[];
}
