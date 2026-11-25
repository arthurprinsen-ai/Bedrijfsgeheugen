import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production readback validates the canonical built pricing DOM', () => {
  const live = fs.readFileSync('tools/site-shell/live-contract.mjs','utf8');

  for (const token of [
    "['href', '#saas']",
    "['href', '#expertise']",
    "'pkgSize'",
    "'pkgGoal'",
    "'pkgMode'",
    "'pkgGo'",
    "'Starter'",
    "'Pro'",
    "'Groei'",
    "'Enterprise'",
  ]) {
    assert.match(live,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }

  for (const retired of [
    "['data-tab', 'saas']",
    "['data-panel', 'saas']",
    "'fitSize'",
    "'fitGoal'",
    "'fitMode'",
    "'fitGo'",
  ]) {
    assert.doesNotMatch(live,new RegExp(retired.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});
