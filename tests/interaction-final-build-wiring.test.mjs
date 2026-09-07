import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkFinalInteractionWiring } from '../quality/check-final-interaction-wiring.mjs';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'bg-interaction-'));
  mkdirSync(join(root, 'tools'), { recursive: true });
  writeFileSync(join(root, 'netlify.toml'), '[build]\ncommand = "node tools/other.mjs"\n');
  writeFileSync(join(root, 'tools/prijzen-uit-de-homepage.mjs'), '');
  writeFileSync(join(root, 'tools/bouw-v18-homepage-scroll-story.mjs'), '');
  writeFileSync(join(root, 'tools/bouw-v18-homepage-platform-expertise-toggle.mjs'), '');
  return root;
}

test('missing final-build wiring fails closed with classified diagnostics', () => {
  const result = checkFinalInteractionWiring({ rootDir: fixture() });
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
  assert.ok(result.errors.every(error => error.code === 'build-wiring-loss'));
  assert.ok(result.errors.some(error => error.path === 'netlify.toml'));
  assert.ok(result.errors.some(error => error.contractId === 'homepage-scroll-story'));
});

test('real repository preserves final interaction wiring', () => {
  const result = checkFinalInteractionWiring({ rootDir: process.cwd() });
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});
