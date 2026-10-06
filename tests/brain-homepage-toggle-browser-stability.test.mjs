import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../tools/site-shell/homepage-toggle-browser-check.mjs', import.meta.url), 'utf8');

test('historical replay: homepage toggle browser check recenters tabs before physical click', () => {
  assert.match(source, /scrollIntoView\(\{ block: 'center', inline: 'center', behavior: 'instant' \}\)/);
  assert.match(source, /await tab\.click\(\{ timeout: 8000 \}\)/);
});

test('historical replay: click remains a real interactability check and retries boundedly', () => {
  assert.match(source, /attempt <= 3/);
  assert.doesNotMatch(source, /force:\s*true/);
  assert.match(source, /clickStableTab\('#homepage-expertise-tab'\)/);
  assert.match(source, /clickStableTab\('#homepage-platform-tab'\)/);
});


test('homepage toggle navigation does not depend on networkidle and retries boundedly', () => {
  assert.doesNotMatch(source, /page\.goto\([^\n]+waitUntil:\s*['"]networkidle['"]/);
  assert.match(source, /async function gotoWithRetry/);
  assert.match(source, /attempt <= attempts/);
  assert.match(source, /attempts = 3/);
  assert.match(source, /waitUntil:\s*['"]domcontentloaded['"]/);
  assert.match(source, /#homepage-expertise-tab/);
  assert.match(source, /#homepage-platform-tab/);
});
