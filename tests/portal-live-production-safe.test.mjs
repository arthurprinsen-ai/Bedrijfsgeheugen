import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const liveShell = readFileSync(new URL('../portal-live/index.html', import.meta.url), 'utf8');

test('production shell sanitizes preview identity, period, KPIs and management examples before render', () => {
  assert.match(liveShell, /fetch\('\/portal-next\/index\.html'/);
  assert.match(liveShell, /Arthur Prinsen/);
  assert.match(liveShell, /Geverifieerde gebruiker/);
  assert.match(liveShell, /Periode: Mei 2025/);
  assert.match(liveShell, /Periode: actuele data/);
  assert.match(liveShell, /72<small>\/100<\/small>/);
  assert.match(liveShell, /Geen geverifieerde data/);
  assert.match(liveShell, /Kennisrisico Finance/);
  assert.match(liveShell, /Geen geverifieerde aandachtspunten beschikbaar/);
});

test('production shell fails closed and never silently serves unsanitized preview HTML', () => {
  assert.match(liveShell, /throw new Error\('portal-next unavailable'/);
  assert.match(liveShell, /Bedrijfsdata kon niet veilig worden geladen/);
  assert.doesNotMatch(liveShell, /document\.write\(html\)/);
  assert.match(liveShell, /document\.write\(sanitized\)/);
});
