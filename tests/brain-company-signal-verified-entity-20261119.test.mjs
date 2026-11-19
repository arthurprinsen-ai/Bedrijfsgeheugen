import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../supabase/migrations/20261119090500_company_signal_word_boundary_verified_entity_v1.sql', import.meta.url),
  'utf8'
);
// Lesson STRIP_SQL_COMMENTS_BEFORE_SEMANTIC_ASSERTIONS: assert on executable SQL only.
const code = sql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');

test('company mention must be a whole word with exact spelling, never a raw substring', () => {
  assert.match(code, /\[\^\[:alnum:\]\]/, 'word boundary on both sides is required');
  assert.match(code, /concat_ws\(' ',s\.headline,s\.summary\)\s*~\s*\(/, 'case-sensitive regex match on original text');
  assert.match(code, /c\.company_name\s*~\s*'\^\[\[:upper:\]\]'/, 'brand names must be capitalised');
});

test('the legacy substring method label is no longer produced', () => {
  assert.doesNotMatch(code, /then 'explicit_company_mention'\b/);
  assert.match(code, /'explicit_company_mention_wb'/);
});

test('common words and months cannot become a company entity', () => {
  for (const word of ['oktober', 'april', 'datum', 'deel', 'geen', 'maak']) {
    assert.ok(code.includes(`'${word}'`), `stoplist misses ${word}`);
  }
});

test('output columns stay identical so dependent views and the daily resolver keep working', () => {
  const tail = code.slice(code.lastIndexOf('select company_key'));
  const cols = tail.slice(0, tail.indexOf('from matched')).replace(/select|\s/g, '').split(',').filter(Boolean);
  assert.deepEqual(cols, ['company_key', 'company_name', 'source_type', 'source_ref', 'headline', 'summary', 'signal_type', 'observed_at', 'confidence', 'resolution_method']);
});

test('trigger view ignores legacy fragments and its own growth-swarm output, and fails loudly if the rewrite does not apply', () => {
  assert.match(code, /resolved-company:%/);
  assert.match(code, /growth-swarm%/);
  assert.match(code, /TRIGGER_VIEW_PREDICTIVE_FILTER_NOT_APPLIED/);
  assert.match(code, /TRIGGER_VIEW_SWARM_FEEDBACK_FILTER_NOT_APPLIED/);
  assert.match(code, /security_invoker=true/);
});

test('no data is deleted or rewritten by the migration', () => {
  assert.doesNotMatch(code, /\bdelete\s+from\b|\btruncate\b|\bdrop\s+(table|view)\b|\bupdate\s+public\./i);
});

test('both internal views stay server-only', () => {
  assert.match(code, /revoke all on public\.powerhouse_company_signal_resolution_v1 from public, anon, authenticated/);
  assert.match(code, /revoke all on public\.powerhouse_mkb_trigger_intelligence_v1 from public, anon, authenticated/);
});
