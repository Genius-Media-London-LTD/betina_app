import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const rootHtml = readFileSync(new URL('../app/+html.tsx', import.meta.url), 'utf8');
const article = readFileSync(new URL('../app/article.tsx', import.meta.url), 'utf8');
const liveFeed = readFileSync(new URL('../app/(tabs)/live.tsx', import.meta.url), 'utf8');
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const appConfig = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const exportedHtml = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const canonicalSource = readFileSync(new URL('../src/lib/genius2playCanonical.ts', import.meta.url), 'utf8');
const canonicalModule = { exports: {} };
const canonicalJavaScript = ts.transpileModule(canonicalSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function('exports', 'module', canonicalJavaScript)(canonicalModule.exports, canonicalModule);
const { safeGenius2PlayCanonical } = canonicalModule.exports;

const robots = 'noindex, nofollow, noarchive, nosnippet';

test('BETina web is globally noindex in HTML and HTTP headers', () => {
  assert.equal(appConfig.expo.web.output, 'single');
  assert.match(rootHtml, /name="robots"/);
  assert.match(rootHtml, new RegExp(robots));
  assert.match(exportedHtml, new RegExp(`<meta name="robots" content="${robots}">`));
  const catchAll = vercel.headers.find((entry) => entry.source === '/(.*)');
  assert.ok(catchAll);
  assert.deepEqual(catchAll.headers, [{ key: 'X-Robots-Tag', value: robots }]);
  assert.deepEqual(vercel.rewrites, [{ source: '/(.*)', destination: '/index.html' }]);
});

test('article pages expose the Genius2Play canonical from the API', () => {
  assert.match(article, /import Head from 'expo-router\/head'/);
  assert.match(article, /import \{ safeGenius2PlayCanonical \}/);
  assert.match(article, /canonical\?: string/);
  assert.match(article, /canonical: safeGenius2PlayCanonical\(d\?\.canonical\)/);
  assert.match(article, /<link rel="canonical" href=\{article\.canonical\} \/>/);
  assert.doesNotMatch(liveFeed, /item\.source|news\[0\]\.source/);
  assert.match(article, /article\.source/);
  assert.equal(
    safeGenius2PlayCanonical('https://www.genius2play.com/de/football/news/sicherer-artikel'),
    'https://www.genius2play.com/de/football/news/sicherer-artikel',
  );
  for (const unsafe of [
    'javascript:alert(1)',
    'http://www.genius2play.com/de/football/news/story',
    'https://evil.example/de/football/news/story',
    'https://www.genius2play.com/de/football/news/story?x=1',
    'https://www.genius2play.com/de/%2F/news/story',
  ]) {
    assert.equal(safeGenius2PlayCanonical(unsafe), '');
  }
});
