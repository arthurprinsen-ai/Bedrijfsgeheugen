import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('human commercial conversion engine is canonical, evidence-bound and fail-closed', async () => {
  const [composer, email, linkedin, migration] = await Promise.all([
    read('supabase/functions/powerhouse-commercial-message-composer/index.ts'),
    read('supabase/functions/powerhouse-autonomous-outreach/index.ts'),
    read('supabase/functions/powerhouse-linkedin-sales-machine/index.ts'),
    read('supabase/migrations/20261005152000_powerhouse_human_commercial_conversion_engine_v1.sql'),
  ]);

  assert.match(composer, /powerhouse-human-commercial-message-composer-v2/);
  assert.match(composer, /powerhouse_persuasion_revenue_optimizer_v1/);
  assert.match(composer, /sourceSpecificContext/);
  assert.match(composer, /sourceContext\.includes\(anchorNormalized\)/);
  assert.match(composer, /inspirerend\|indrukwekkend\|geweldig/);
  assert.match(composer, /veel \(bedrijven\|organisaties\|founders/);
  assert.match(composer, /rows=rows\.filter\(\(a:any\)=>a\.evidence\?\.commercial_intelligence\?\.composer\?\.contract!==CONTRACT/);

  assert.match(email, /composer\?\.contract!=='powerhouse-human-commercial-message-composer-v2'/);
  assert.match(email, /HUMAN_MESSAGE_QUALITY_NOT_PROVEN/);
  assert.match(linkedin, /composerProof\?\.contract!=='powerhouse-human-commercial-message-composer-v2'/);
  assert.match(linkedin, /HUMAN_MESSAGE_QUALITY_NOT_PROVEN/);

  assert.match(migration, /powerhouse_sales_playbook_v1/);
  assert.match(migration, /powerhouse_message_quality_v1/);
  assert.match(migration, /powerhouse_commercial_message_candidates_v1/);
  assert.match(migration, /powerhouse_sales_play_performance_v2/);
  assert.match(migration, /powerhouse-human-sales-composer-v2/);
  assert.match(migration, /3,18,33,48 \* \* \* \*/);
});
