import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('content operations replay uses only production-ledger migration identities', () => {
  const migrations = path.join(ROOT, 'supabase', 'migrations');
  assert.equal(fs.existsSync(path.join(migrations, '20260914093000_unified_content_publication_operations.sql')), false);
  assert.equal(fs.existsSync(path.join(migrations, '20260914100133_unified_content_publication_operations.sql')), true);
  assert.equal(fs.existsSync(path.join(migrations, '20260916091500_powerhouse_structure_hygiene_v2.sql')), false);
  assert.equal(fs.existsSync(path.join(migrations, '20260916091505_powerhouse_structure_hygiene_v2.sql')), true);
});
