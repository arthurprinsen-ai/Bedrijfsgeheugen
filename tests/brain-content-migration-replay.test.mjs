import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function cockpitQuery(name) {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', name), 'utf8');
  const match = sql.match(/create or replace view public\.content_operations_cockpit(?:\s+with\s*\([^)]*\))?\s+as\s+(select[\s\S]*?;)/i);
  assert.ok(match, `${name} must define public.content_operations_cockpit`);
  return match[1].replace(/\s+/g, ' ').trim();
}

test('successive unified content migrations preserve the cockpit view shape', () => {
  assert.equal(
    cockpitQuery('20260914093000_unified_content_publication_operations.sql'),
    cockpitQuery('20260914100133_unified_content_publication_operations.sql'),
    'CREATE OR REPLACE VIEW cannot remove or rename existing columns during a clean migration replay',
  );
});
