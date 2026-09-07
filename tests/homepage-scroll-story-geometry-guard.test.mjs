import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('homepage scroll story is progressive enhancement and never owns page geometry', () => {
  const source = readFileSync('tools/bouw-v18-homepage-scroll-story.mjs', 'utf8');
  const desktopBlock = source.match(/@media\(min-width:1024px\)\{([\s\S]*?)\n\}/)?.[1] || '';

  assert.doesNotMatch(source, /min-height\s*:\s*\d+(?:\.\d+)?vh/i, 'story runtime may not manufacture multi-viewport blank space');
  assert.doesNotMatch(desktopBlock, /position\s*:\s*sticky/i, 'story runtime may not turn an existing homepage container into a sticky stage');
  assert.doesNotMatch(source, /window\.scrollTo\s*\(/, 'story interactions may not hijack the visitor scroll position');
  assert.match(source, /nearestStepToViewportCenter/, 'scroll state must be derived from existing step geometry');
  assert.match(source, /isRootInViewport/, 'cost-widget suppression must follow actual viewport intersection');
});

test('homepage visual regression contract protects the interactive story itself', () => {
  const registry = JSON.parse(readFileSync('config/ui-visual-regression.json', 'utf8'));
  const home = registry.pages.find(page => page.route === '/');
  assert.ok(home, 'homepage visual regression contract missing');
  assert.ok(home.required.includes('[data-bg-story-root]'), 'story root must be measured in browser readback');
  assert.ok(home.required.includes('[data-bg-story-visual]'), 'story cockpit/visual must be measured in browser readback');
  assert.equal(home.maxElementHeightViewportRatio?.['[data-bg-story-root]'], 1.75, 'story may never expand into a multi-screen blank block');
});
