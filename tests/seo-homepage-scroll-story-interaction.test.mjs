import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const STORY = 'tools/bouw-v18-homepage-scroll-story.mjs';
const CHECK = 'tools/site-shell/homepage-story-browser-check.mjs';

test('homepage story is projected on final output without runtime layout discovery', () => {
  assert.equal(existsSync(STORY), true);
  const pipeline = readFileSync('tools/prijzen-uit-de-homepage.mjs', 'utf8');
  assert.match(pipeline, /bouw-v18-homepage-scroll-story\.mjs/);
  const source = readFileSync(STORY, 'utf8');
  for (const marker of ['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Analyseer impact']) assert.match(source,new RegExp(marker));
  assert.match(source,/data-bg-story-root/);
  assert.match(source,/markStorySection/);
  assert.doesNotMatch(source,/function\s+findRoot\s*\(/);
  assert.doesNotMatch(source,/function\s+chooseVisual\s*\(/);
  assert.doesNotMatch(source,/appendChild\s*\(/);
  assert.doesNotMatch(source,/window\.scrollTo\s*\(/);
  assert.doesNotMatch(source,/position\s*:\s*sticky/i);
  assert.doesNotMatch(source,/min-height\s*:\s*\d+(?:\.\d+)?vh/i);
  assert.match(source,/min-height:0!important;/);
  assert.match(source,/height:auto!important;/);
  assert.match(source,/\[\$\{ROOT_ATTR\}\]>\*\{[^}]*height:auto!important[^}]*position:relative!important[^}]*top:auto!important/s);
  assert.match(source,/\[\$\{ROOT_ATTR\}\]\s+\[data-bg-story-stage\]\{[^}]*position:relative!important[^}]*height:auto!important[^}]*min-height:0!important/s);
  assert.match(source,/IntersectionObserver/);
  assert.match(source,/aria-current/);
  assert.match(source,/data-bg-story-cost/);
});

test('exact blank-screen regression is a required preview and production browser gate', () => {
  assert.equal(existsSync(CHECK), true);
  const check = readFileSync(CHECK,'utf8');
  assert.match(check,/1536/); assert.match(check,/864/); assert.match(check,/data-bg-story-root/);
  assert.match(check,/rootHeight|heightRatio/); assert.match(check,/Signaal komt binnen/); assert.match(check,/Analyseer impact/); assert.match(check,/blank|meaningful/i);
  const required=readFileSync('.github/workflows/required-test.yml','utf8');
  const production=readFileSync('.github/workflows/canonical-brand-shell-live-readback.yml','utf8');
  assert.match(required,/seo-homepage-scroll-story-interaction\.test\.mjs/);
  assert.match(required,/homepage-story-browser-check\.mjs/);
  assert.match(production,/homepage-story-browser-check\.mjs/);
});
