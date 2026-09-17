import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const design = readFileSync(new URL('../docs/superpowers/specs/2026-09-17-powerhouse-one-loop-v1-design.md', import.meta.url), 'utf8');
const hygiene = JSON.parse(readFileSync(new URL('../config/powerhouse-delivery-hygiene-v1.json', import.meta.url), 'utf8'));

test('One Loop explicitly extends the existing delivery control-plane instead of adding a queue', () => {
  assert.match(design, /Do not add a second brain, database, queue, scheduler, calendar, learning store/i);
  assert.ok(hygiene.version === 'POWERHOUSE-DELIVERY-HYGIENE-v1');
});
