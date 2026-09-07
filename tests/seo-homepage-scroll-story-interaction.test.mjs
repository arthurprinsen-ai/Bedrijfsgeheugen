import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const STORY = 'tools/bouw-v18-homepage-scroll-story.mjs';
const CHECK = 'tools/site-shell/homepage-story-browser-check.mjs';

test('homepage story is projected on final output without runtime layout discovery', () => {
  assert.equal(existsSync(STORY), true, 'homepage story build step is missing');
  const pipeline = readFileSync('tools/prijzen-uit-de-homepage.mjs', 'utf8');
  assert.match(pipeline, /bouw-v18-homepage-scroll-story\.mjs/, 'story projection must run on final built homepage output');

  const source = readFileSync(STORY, 'utf8');
  for (const marker of ['Signaal komt binnen', 'Context wordt begrepen', 'Opvolging ontstaat', 'Analyseer impact']) {
    assert.match(source, new RegExp(marker), `required story marker is missing: ${marker}`);
  }

  assert.match(source, /data-bg-story-root/, 'build step must emit one explicit story root');
  assert.match(source, /markStoryRoot|markStorySection/, 'story root must be selected once at build time');
  assert.doesNotMatch(source, /function\s+findRoot\s*\(/, 'runtime ancestor discovery is forbidden');
  assert.doesNotMatch(source, /function\s+chooseVisual\s*\(/, 'runtime visual-container discovery is forbidden');
  assert.doesNotMatch(source, /getBoundingClientRect\(\).*width|\.width>=\d+&&.*\.height>=/s, 'runtime geometry may not choose a layout owner');
  assert.doesNotMatch(source, /appendChild\s*\(/, 'story enhancement may not inject geometry-owning overlays');
  assert.doesNotMatch(source, /window\.scrollTo\s*\(/, 'story may never hijack visitor scrolling');
  assert.doesNotMatch(source, /position\s*:\s*sticky/i, 'story enhancement may never manufacture a sticky stage');
  assert.doesNotMatch(source, /min-height\s*:\s*\d+(?:\.\d+)?vh/i, 'story enhancement may never manufacture multi-viewport height');

  assert.match(source, /\[data-bg-story-root\][^{]*\{[^}]*min-height:0!important[^}]*height:auto!important/s,
    'explicit story root must collapse any inherited manufactured height');
  assert.match(source, /IntersectionObserver/, 'story activation must observe the explicit root rather than infer a page-wide stage');
  assert.match(source, /aria-current/, 'active story step must expose accessible state');
  assert.match(source, /data-bg-story-cost/, 'cost widget needs an explicit overlap suppression hook');
});

test('the exact blank-screen regression is a required preview and production browser gate', () => {
  assert.equal(existsSync(CHECK), true, 'dedicated homepage story browser check is missing');
  const check = existsSync(CHECK) ? readFileSync(CHECK, 'utf8') : '';
  assert.match(check, /1536/, 'browser regression must cover the desktop width from the reported failure');
  assert.match(check, /864/, 'browser regression must cover the desktop height from the reported failure');
  assert.match(check, /data-bg-story-root/, 'browser check must inspect the explicit story root');
  assert.match(check, /rootHeight|heightRatio/, 'browser check must fail on a multi-screen story root');
  assert.match(check, /Signaal komt binnen/, 'browser check must verify visible story copy');
  assert.match(check, /Analyseer impact/, 'browser check must verify the cockpit CTA shares the composition');
  assert.match(check, /blank|meaningful/i, 'browser check must explicitly guard against blank viewport states');

  const required = readFileSync('.github/workflows/required-test.yml', 'utf8');
  const production = readFileSync('.github/workflows/canonical-brand-shell-live-readback.yml', 'utf8');
  assert.match(required, /seo-homepage-scroll-story-interaction\.test\.mjs/, 'architecture regression test must be required');
  assert.match(required, /homepage-story-browser-check\.mjs/, 'deploy preview must run the dedicated story browser check');
  assert.match(production, /homepage-story-browser-check\.mjs/, 'production readback must run the dedicated story browser check');
});
