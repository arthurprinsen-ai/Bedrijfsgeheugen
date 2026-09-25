import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('i18n exact-main recovery contract covers all mandatory public routes', () => {
  const doc = fs.readFileSync('docs/learning/2026-09-25-i18n-exact-main-production-recovery.md', 'utf8');
  for (const route of ['/', '/prijzen', '/systemen-koppelen']) {
    assert.ok(doc.includes(route), `missing mandatory production readback route: ${route}`);
  }
  assert.match(doc, /commit_ref === protected main SHA/);
  assert.match(doc, /production\/source drift/i);
  assert.match(doc, /Do not mark LIVE until all are proven/);
});
