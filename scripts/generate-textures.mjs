#!/usr/bin/env node
/**
 * Pre-bake procedural planetary surface & cloud maps from `src/components/TextureGenerator.ts`
 * into static `.webp` assets under `public/textures/planets/`.
 *
 * Usage:
 *   npm run generate:textures
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(projectRoot, 'public', 'textures', 'planets');

const WORLD_TEXTURES = [
  'Mercury',
  'Venus',
  'EarthClouds',
  'Mars',
  'Phobos',
  'Deimos',
  'Jupiter',
  'Io',
  'Europa',
  'Ganymede',
  'Callisto',
  'Saturn',
  'Mimas',
  'Enceladus',
  'Titan',
  'Iapetus',
  'Uranus',
  'Neptune',
  'Triton',
  'Pluto',
  'Charon',
  'Ceres',
  'Eris',
  'Haumea',
  'Makemake',
];

async function main() {
  const vite = await import('vite');
  const { chromium } = await import('playwright');

  await fs.mkdir(outDir, { recursive: true });

  const server = await vite.createServer({
    root: projectRoot,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false },
  });
  await server.listen();
  const baseUrl = server.resolvedUrls?.local?.[0];
  if (!baseUrl) {
    await server.close();
    throw new Error('Failed to resolve local Vite server URL');
  }

  const channel = process.env.PERF_CHANNEL || 'chrome';
  const browser = await chromium.launch({
    headless: true,
    ...(channel === 'bundled' ? {} : { channel }),
    args: ['--enable-gpu', '--ignore-gpu-blocklist'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
    });
    await context.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 0, configurable: true });
      delete window.ontouchstart;
    });

    const page = await context.newPage();
    // Serve a minimal HTML shell on the Vite origin so we can import TextureGenerator.ts directly
    await page.route('**/__gen.html', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
    );
    await page.goto(`${baseUrl}__gen.html`, { waitUntil: 'domcontentloaded' });

    let totalBytes = 0;
    for (const name of WORLD_TEXTURES) {
      const t0 = Date.now();
      const base64 = await page.evaluate(
        async ({ worldName }) => {
          const mod = await import('/solar-system-3d/src/components/TextureGenerator.ts');
          const { TextureGenerator } = mod;
          const tex = TextureGenerator.getPlanetTexture(worldName);
          const canvas = tex.image;
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
          const buf = await blob.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = '';
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
          }
          TextureGenerator.dispose();
          return btoa(binary);
        },
        { worldName: name },
      );

      const buffer = Buffer.from(base64, 'base64');
      const filePath = path.join(outDir, `${name}.webp`);
      await fs.writeFile(filePath, buffer);
      totalBytes += buffer.length;
      console.log(
        `  ✓ ${name.padEnd(12)} ${(buffer.length / 1024).toFixed(1).padStart(6)} KB  (${Date.now() - t0} ms)`,
      );
    }

    console.log(
      `\nGenerated ${WORLD_TEXTURES.length} WebP textures in ${path.relative(projectRoot, outDir)} (${(totalBytes / 1024).toFixed(1)} KB total).`,
    );
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error('generate-textures failed:', err);
  process.exit(1);
});
