import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration=fs.readFileSync('supabase/migrations/20261005143000_powerhouse_human_commercial_message_learning_gate_v1.sql','utf8');
const composer=fs.readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
const compat=fs.readFileSync('supabase/functions/powerhouse-human-sales-composer/index.ts','utf8');
const email=fs.readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
const linkedin=fs.readFileSync('supabase/functions/powerhouse-linkedin-sales-machine/index.ts','utf8');


assert.match(migration,/powerhouse_message_quality_v1/);
assert.match(migration,/powerhouse_outbound_message_quality_gate_v1/);
assert.match(migration,/powerhouse_sales_outcome_message_lineage_v1/);
assert.match(migration,/powerhouse_sales_play_performance_v1/);
assert.match(migration,/powerhouse_refresh_sales_play_learnings_v1/);
assert.match(migration,/powerhouse_commercial_closed_loop_v6/);
assert.match(migration,/exact passed message_hash required before outbound waiting\/done/);

assert.match(composer,/powerhouse_persuasion_revenue_optimizer_v1/);
assert.match(composer,/powerhouse_message_quality_v1/);
assert.match(composer,/personalization_anchor/);
assert.match(composer,/source_trigger_relevance/);
assert.match(composer,/internal taxonomy|snake_case/i);
assert.match(composer,/quality_passed/);

assert.match(compat,/powerhouse-commercial-message-composer/);
assert.match(email,/powerhouse-commercial-message-composer/);
assert.match(email,/HUMAN_MESSAGE_QUALITY_NOT_PROVEN/);
assert.match(linkedin,/powerhouse-commercial-message-composer/);
assert.match(linkedin,/HUMAN_MESSAGE_QUALITY_NOT_PROVEN/);

console.log('human commercial message loop contract OK');
