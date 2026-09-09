import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagePath = new URL('../intern/linkedin-revenue/index.html', import.meta.url);
const scriptPath = new URL('../intern/linkedin-revenue/cockpit.js', import.meta.url);
const functionPath = new URL('../netlify/functions/linkedin-revenue-cockpit.mjs', import.meta.url);
const runtimePath = new URL('../supabase/functions/powerhouse-runtime/index.ts', import.meta.url);
const migrationPath = new URL('../supabase/migrations/20260909140000_powerhouse_revenue_command_center.sql', import.meta.url);

test('Revenue Command Center is execution-first and bounded to 15 actions', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /data-cockpit="powerhouse-revenue-command-center"/);
  assert.match(html, /data-max-actions="15"/);
  assert.match(html, /Order Queue/);
  for (const label of ['Radar', 'Gesprekken', 'Relaties', 'Content', 'Deals', 'Learning', 'Systeem']) {
    assert.ok(html.includes(label), `missing Revenue Command Center view: ${label}`);
  }
  assert.match(html, /Verwachte omzet/i);
  assert.match(html, /Conversiekans/i);
});

test('client records canonical outcomes instead of local-only Done state', () => {
  const client = fs.readFileSync(scriptPath, 'utf8');
  assert.match(client, /method:\s*['"]POST['"]/);
  for (const outcome of ['executed','reply_received','no_response','meeting_booked','offer_created','order_won','revenue_observed','not_relevant','defer']) {
    assert.ok(client.includes(outcome), `missing canonical outcome control: ${outcome}`);
  }
  assert.doesNotMatch(client, /localStorage\.setItem\([^)]*linkedin-revenue-done/);
  assert.match(client, /reload|loadCockpit/i);
});

test('cockpit keeps evidence guards and never makes generic feed evidence actionable', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.ok(!html.includes('href="https://www.linkedin.com/feed/"'), 'generic LinkedIn feed may not be an action source');
  assert.match(html, /Geen tekst zonder bewijs|bewijs/i);
  assert.match(html, /Context nodig|context_required|Context aanvullen/i);
});

test('Netlify adapter uses canonical Supabase core with Notion only as enrichment', () => {
  const code = fs.readFileSync(functionPath, 'utf8');
  assert.match(code, /POWERHOUSE_CORE_URL/);
  assert.match(code, /POWERHOUSE_CORE_TOKEN/);
  assert.match(code, /x-powerhouse-token/i);
  assert.match(code, /powerhouse-revenue-command-center-v1/);
  for (const route of ['/health','/actions','/opportunities','/learning','/recommendations','/outcomes']) {
    assert.ok(code.includes(route), `missing canonical core route ${route}`);
  }
  assert.match(code, /sourceHealth/);
  assert.match(code, /Notion/i);
});

test('Supabase runtime exposes explainable revenue-first opportunity ranking', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'Revenue Command Center migration must exist');
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(runtime, /expected_revenue_value/);
  assert.match(runtime, /score_components/);
  assert.match(runtime, /powerhouse_opportunities/);
  assert.match(runtime, /route==='opportunities'/);
  assert.match(runtime, /route==='recommendations'/);
  assert.match(runtime, /NON_LEARNING_OUTCOMES[^\n]*executed[^\n]*skipped/);
  assert.match(sql, /create table(?: if not exists)? public\.powerhouse_opportunities/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on public\.powerhouse_opportunities from anon, authenticated/i);
  assert.match(sql, /grant all on public\.powerhouse_opportunities to service_role/i);
});

test('private CRM snapshot is never committed into the cockpit', () => {
  assert.ok(!fs.existsSync(new URL('../intern/linkedin-revenue/data.json', import.meta.url)), 'private CRM snapshot must not be committed');
});
