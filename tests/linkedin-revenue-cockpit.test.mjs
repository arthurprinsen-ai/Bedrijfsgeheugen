import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagePath = new URL('../intern/linkedin-revenue/index.html', import.meta.url);
const scriptPath = new URL('../intern/linkedin-revenue/cockpit.js', import.meta.url);
const functionPath = new URL('../netlify/functions/linkedin-revenue-cockpit.mjs', import.meta.url);
const runtimePath = new URL('../supabase/functions/powerhouse-runtime/index.ts', import.meta.url);
const migrationPath = new URL('../supabase/migrations/20260909131127_powerhouse_revenue_command_center.sql', import.meta.url);

test('Revenue Command Center is execution-first and bounded to 15 actions', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /data-cockpit="powerhouse-revenue-command-center"/);
  assert.match(html, /data-sales-os="predictive-v2"/);
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


test('cockpit exposes fast sales-operating-system controls', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  const client = fs.readFileSync(scriptPath, 'utf8');
  for (const id of ['queueSearch','focusMode','nextAction','mExecutable','mHot','mDensity']) {
    assert.ok(html.includes(`id="${id}"`), `missing fast cockpit control ${id}`);
  }
  assert.match(html, /Buying-window heat/i);
  assert.match(html, /Revenue density/i);
  assert.match(client, /function applyQueueView/);
  assert.match(client, /moveSelection/);
  assert.match(client, /copySelected/);
  assert.match(client, /openSelected/);
  assert.match(client, /event\.key==='j'/);
  assert.match(client, /event\.key==='k'/);
});

test('cockpit adapter projects predictive sales intelligence without inventing it', () => {
  const code = fs.readFileSync(functionPath, 'utf8');
  for (const field of ['buyingWindowScore','relationshipWarmth','companyIntentScore','forecastProbability','forecastConfidence','firstMoverScore','signalTopics']) {
    assert.ok(code.includes(field), `missing predictive field ${field}`);
  }
  assert.match(code, /hotActions/);
  assert.match(code, /revenueDensity/);
  assert.match(code, /Math\.max\(n\(x\.buyingWindowScore\)/);
});


test('LinkedIn cockpit autopilot is part of the canonical social publisher', () => {
  const source = fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url), 'utf8');
  assert.match(source, /async function runLinkedInCockpitAutopilot\(db:any\)/);
  assert.match(source, /LINKEDIN_CREATE_COMMENT_ON_POST/);
  assert.match(source, /\.eq\('status','suggested'\)/);
  assert.match(source, /status:'dispatching'/);
  assert.match(source, /status:'executed'/);
  assert.match(source, /provider_ack_verified:true/);
  assert.match(source, /powerhouse_record_outcome/);
});

test('LinkedIn cockpit autopilot keeps unsupported DM and connection actions as capability exceptions', () => {
  const source = fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url), 'utf8');
  assert.match(source, /\['reply_dm','activate_connection'\]\.includes\(type\)/);
  assert.match(source, /LINKEDIN_CAPABILITY_NOT_AVAILABLE/);
});

test('LinkedIn cockpit autopilot requires concrete post context and exact comment text', () => {
  const source = fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url), 'utf8');
  assert.match(source, /linkedin\\\.com/);
  assert.match(source, /CONCRETE_POST_CONTEXT_REQUIRED/);
  assert.match(source, /Comment text: \$\{message\}/);
});

test('canonical publisher exposes dedicated autopilot mode and runs it during normal delivery', () => {
  const source = fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url), 'utf8');
  assert.match(source, /mode === 'cockpit_autopilot'/);
  const calls = (source.match(/await runLinkedInCockpitAutopilot\(db\)/g) || []).length;
  assert.ok(calls >= 2);
});
