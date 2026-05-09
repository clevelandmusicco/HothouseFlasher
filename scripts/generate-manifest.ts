#!/usr/bin/env tsx
/**
 * Fetches the latest release from clevelandmusicco/HothouseExamples,
 * downloads all .bin assets into public/firmware/, and writes
 * public/firmware-manifest.json.
 *
 * Run by GitHub Actions before the Vite build step.
 * Requires no secrets for public GitHub repos (anonymous API access).
 */

import { writeFileSync, mkdirSync, createWriteStream } from 'fs';
import { get as httpsGet } from 'https';
import { IncomingMessage } from 'http';
import { join } from 'path';

const REPO = 'clevelandmusicco/HothouseExamples';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const FIRMWARE_DIR = join(process.cwd(), 'public', 'firmware');
const MANIFEST_PATH = join(process.cwd(), 'public', 'firmware-manifest.json');

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  assets: GitHubAsset[];
}

function httpsGetJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { 'User-Agent': 'HothouseFlasher/1.0' } }, (res) => {
      // Follow up to one redirect (GitHub API can redirect)
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (!location) return reject(new Error('Redirect with no Location header'));
        return resolve(httpsGetJson<T>(location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      let body = '';
      res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      res.on('end', () => {
        try { resolve(JSON.parse(body) as T); }
        catch (e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    function doGet(u: string): void {
      httpsGet(u, { headers: { 'User-Agent': 'HothouseFlasher/1.0' } }, (res: IncomingMessage) => {
        // GitHub release asset URLs redirect to Azure Blob Storage
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (!location) return reject(new Error('Redirect with no Location header'));
          return doGet(location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} downloading ${u}`));
        }
        const file = createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
        file.on('error', reject);
      }).on('error', reject);
    }
    doGet(url);
  });
}

/** Convert a filename to a display name: "amnesia_delay.bin" → "Amnesia Delay" */
function deriveName(filename: string): string {
  return filename
    .replace(/\.bin$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Derive a GitHub tree URL for the example's README folder: "echo_king.bin" → ".../src/EchoKing" */
function deriveReadmeUrl(filename: string, sourceRepo: string): string {
  const pascal = filename
    .replace(/\.bin$/i, '')
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return `https://github.com/${sourceRepo}/tree/main/src/${pascal}`;
}

async function main(): Promise<void> {
  console.log(`Fetching latest release from ${REPO}…`);
  const release = await httpsGetJson<GitHubRelease>(API_URL);

  console.log(`Release: ${release.tag_name} — ${release.name}`);

  const binAssets = release.assets.filter((a) => a.name.endsWith('.bin'));
  if (binAssets.length === 0) {
    console.error('ERROR: No .bin assets found in the latest release. Aborting.');
    process.exit(1);
  }
  console.log(`Found ${binAssets.length} .bin assets.`);

  mkdirSync(FIRMWARE_DIR, { recursive: true });

  for (const asset of binAssets) {
    const dest = join(FIRMWARE_DIR, asset.name);
    process.stdout.write(`  Downloading ${asset.name} (${Math.round(asset.size / 1024)} KB)… `);
    await downloadFile(asset.browser_download_url, dest);
    process.stdout.write('done\n');
  }

  const manifest = {
    schemaVersion: 1,
    sourceRepo: REPO,
    release: {
      tag: release.tag_name,
      name: release.name,
      url: release.html_url,
    },
    firmware: binAssets.map((asset) => ({
      name: deriveName(asset.name),
      filename: asset.name,
      localPath: `./firmware/${asset.name}`,
      downloadUrl: asset.browser_download_url,
      readmeUrl: deriveReadmeUrl(asset.name, REPO),
      target: 'Hothouse',
      flashTarget: 'internal',
    })),
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Manifest written to ${MANIFEST_PATH}`);
  console.log(`Done. ${binAssets.length} firmware binaries ready.`);
}

main().catch((err) => {
  console.error('generate-manifest failed:', err);
  process.exit(1);
});
