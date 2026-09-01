import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const outputDirectory = resolve('dist');
const expoCli = resolve('node_modules/expo/bin/cli');
const robots = 'noindex, nofollow, noarchive, nosnippet';
const robotsMeta = `<meta name="robots" content="${robots}">`;

rmSync(outputDirectory, { recursive: true, force: true });
const result = spawnSync(
  process.execPath,
  [expoCli, 'export', '--platform', 'web', '--output-dir', outputDirectory],
  { stdio: 'inherit' },
);
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const indexPath = resolve(outputDirectory, 'index.html');
let html = readFileSync(indexPath, 'utf8');
if (!html.includes('name="robots"')) {
  if (!html.includes('</head>')) {
    throw new Error('Expo export has no closing head tag');
  }
  html = html.replace('</head>', `  ${robotsMeta}</head>`);
  writeFileSync(indexPath, html);
}

const verified = readFileSync(indexPath, 'utf8');
if (!verified.includes(robotsMeta)) {
  throw new Error('Noindex verification failed for exported index.html');
}
console.log('betina_web_noindex_verified');
