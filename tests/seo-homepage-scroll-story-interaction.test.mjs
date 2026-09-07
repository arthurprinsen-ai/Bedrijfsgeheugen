import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(here, '../tools/bouw-v18-homepage-scroll-story.mjs');

test('homepage scroll story is wired as progressive enhancement without desktop layout takeover', () => {
  assert.equal(existsSync(scriptPath), true, 'homepage scroll-story build step is missing');

  const pipeline = readFileSync(resolve(here, '../tools/prijzen-uit-de-homepage.mjs'), 'utf8');
  assert.match(
    pipeline,
    /bouw-v18-homepage-scroll-story\.mjs/,
    'scroll-story fix is not part of the final homepage build/verification pipeline',
  );

  const source = readFileSync(scriptPath, 'utf8');
  for (const marker of ['Signaal komt binnen', 'Context wordt begrepen', 'Opvolging ontstaat', 'Analyseer impact']) {
    assert.match(source, new RegExp(marker), `required story marker is missing: ${marker}`);
  }

  assert.match(source, /setStoryState/, 'scroll and click must share one canonical state setter');
  assert.match(source, /requestAnimationFrame/, 'scroll updates must be frame-bounded');
  assert.match(source, /addEventListener\('click'/, 'CTA and/or story steps must be clickable');
  assert.match(source, /prefers-reduced-motion/, 'reduced-motion behavior is missing');
  assert.match(source, /data-bg-story-state/, 'story state must be reflected in DOM state');
  assert.match(source, /data-bg-story-step/, 'story steps must expose explicit state hooks');
  assert.match(source, /data-bg-story-overlay/, 'cockpit must visibly change between story states');
  assert.match(source, /Sinds deze pagina opende|Reken het na/, 'cost widget overlap guard is missing');
  assert.doesNotMatch(source, /min-height:\s*360vh/i, 'story root may never create a 360vh blank-screen spacer');
  assert.doesNotMatch(source, /window\.scrollTo\s*\(/, 'story interactions may not hijack the page scroll position');
  assert.match(source, /aria-current/, 'active step must expose its state accessibly');
});

test('build replaces a stale injected scroll-story asset instead of preserving old 360vh CSS', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bg-scroll-story-stale-'));
  const stale = '<!doctype html><html><head><style id="homepage-scroll-story-style">[data-bg-story-root]{min-height:360vh!important}</style></head><body><main><h1>Home</h1></main><script id="homepage-scroll-story-script">/* stale */</script></body></html>';
  await writeFile(join(dir, 'index.html'), stale, 'utf8');

  const run = spawnSync(process.execPath, ['--input-type=module', '--eval', `await import(${JSON.stringify(pathToFileURL(scriptPath).href)});`], {
    cwd: dir,
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);

  const out = await readFile(join(dir, 'index.html'), 'utf8');
  assert.doesNotMatch(out, /min-height:\s*360vh/i, 'stale 360vh CSS must be removed on every build');
  assert.equal((out.match(/id="homepage-scroll-story-style"/g) || []).length, 1, 'exactly one current story style is allowed');
  assert.equal((out.match(/id="homepage-scroll-story-script"/g) || []).length, 1, 'exactly one current story script is allowed');
  assert.match(out, /data-bg-story-root\]\{position:relative;isolation:isolate\}/, 'the current progressive-enhancement CSS must replace the stale asset');
});
