import { cp, copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await copyFile('sw.js', 'dist/sw.js');
await copyFile('manifest.webmanifest', 'dist/manifest.webmanifest');
await cp('branding', 'dist/branding', { recursive: true });
await cp('assets', 'dist/assets', { recursive: true });
await cp('privacy', 'dist/privacy', { recursive: true });
