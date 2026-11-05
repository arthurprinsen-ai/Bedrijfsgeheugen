import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BLOG_VETO_WINDOW_HOURS,
  decideBlogAutoApproval,
  isBlogVetoed,
} from '../supabase/functions/_shared/blog-auto-approval.mjs';
import { runBlogAutoApproval } from '../tools/content-growth/blog-auto-approval.mjs';

const TODAY = '2026-11-05';
// Real shape of the 5 Nov row: generated 23:27 UTC on 4 Nov, business date 5 Nov (Amsterdam).
const generatedAt = '2026-11-04T23:27:25.280Z';
const eligible = new Date(Date.parse(generatedAt) + BLOG_VETO_WINDOW_HOURS * 3600e3);
const obligation = (over = {}) => ({
  publication_date: TODAY, status: 'GENERATED', slug: 'een-lezersgericht-onderwerp',
  content_id: 'blog:een-lezersgericht-onderwerp', canonical_url: 'https://www.bedrijfsgeheugen.nl/blog/een-lezersgericht-onderwerp/',
  generated_at: generatedAt, evidence: {}, ...over,
});
const artifact = (over = {}) => ({ title: 'Kennis die bij één persoon zit', body: 'Een gewone lezersgerichte tekst.', cta: 'Plan een Frisse blik.', status: 'content_ready', ...over });
const decision = (over = {}) => ({ decision: 'publish', state: 'content_ready', ...over });
const after = new Date(eligible.getTime() + 60e3);
const before = new Date(eligible.getTime() - 60e3);
const decide = (over = {}) => decideBlogAutoApproval({
  obligation: obligation(), artifact: artifact(), decision: decision(), now: after, today: TODAY, ...over,
});

test('window: 24 hours would miss the business date, so the window stays inside the same day', () => {
  assert.ok(BLOG_VETO_WINDOW_HOURS > 0 && BLOG_VETO_WINDOW_HOURS < 12);
});

test('replay of the 5 Nov row: waits inside the veto window, approves after it', () => {
  const waiting = decide({ now: before });
  assert.equal(waiting.action, 'WAIT');
  assert.equal(waiting.code, 'VETO_WINDOW_OPEN');
  assert.equal(waiting.eligible_at, eligible.toISOString());
  const approved = decide();
  assert.equal(approved.action, 'APPROVE');
  assert.ok(approved.gates.includes('official_date_truth'));
});

test('a veto always wins, in object and boolean form, and an inactive veto does not', () => {
  assert.equal(decide({ obligation: obligation({ evidence: { veto: { active: true, reason: 'x' } } }) }).code, 'VETOED');
  assert.equal(decide({ obligation: obligation({ evidence: { veto: true } }) }).code, 'VETOED');
  assert.equal(decide({ obligation: obligation({ evidence: { veto: { active: false } } }) }).action, 'APPROVE');
  assert.equal(isBlogVetoed('{"veto":{"active":true}}'), true);
  assert.equal(isBlogVetoed(null), false);
});

test('stale backlog is never auto-approved; future rows are not due', () => {
  assert.equal(decide({ obligation: obligation({ publication_date: '2026-10-28' }) }).code, 'STALE_REQUIRES_REVIEW');
  assert.equal(decide({ obligation: obligation({ publication_date: '2026-11-06' }) }).code, 'NOT_DUE');
});

test('only a GENERATED row moves; rows past approval, failed rows and missing lineage are skipped', () => {
  assert.equal(decide({ obligation: obligation({ status: 'LIVE_PROVEN' }) }).code, 'ALREADY_PAST_APPROVAL');
  assert.equal(decide({ obligation: obligation({ status: 'FAILED' }) }).code, 'NOT_GENERATED');
  assert.equal(decide({ obligation: obligation({ slug: '' }) }).code, 'LINEAGE_MISSING');
  assert.equal(decide({ obligation: null }).code, 'NO_OBLIGATION');
  assert.equal(decide({ obligation: obligation({ generated_at: null }) }).code, 'GENERATED_AT_MISSING');
});

test('no publishable artifact or a non-publish decision blocks approval', () => {
  assert.equal(decide({ artifact: null }).code, 'NO_PUBLISHABLE_ARTIFACT');
  assert.equal(decide({ decision: decision({ decision: 'skip' }) }).code, 'NO_PUBLISHABLE_ARTIFACT');
  assert.equal(decide({ decision: decision({ state: 'blocked' }) }).code, 'NO_PUBLISHABLE_ARTIFACT');
});

test('the official factual gate still blocks approval (inverted subsidy deadline, 1 Nov regression)', () => {
  const bad = artifact({ body: 'De Circular Plastics NL-subsidie is nu open voor aanvragen.' });
  assert.match(decide({ artifact: bad }).code, /^FACT_GATE:BLOG_OFFICIAL_SUBSIDY_DEADLINE_INVERTED$/);
});

function fakeFetch({ ob = obligation(), art = artifact(), dec = decision(), writeOk = true } = {}) {
  const calls = [];
  const impl = async (url, init = {}) => {
    calls.push({ url, init });
    const respond = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });
    if (url.includes('/rpc/record_content_publication_state')) return respond({}, writeOk, writeOk ? 200 : 500);
    if (url.includes('content_publication_obligations')) return respond(ob ? [ob] : []);
    if (url.includes('powerhouse_content_artifacts')) return respond(art ? [art] : []);
    if (url.includes('powerhouse_channel_decisions')) return respond(dec ? [dec] : []);
    throw new Error('unexpected url ' + url);
  };
  return { impl, calls };
}
const env = { SUPABASE_SERVICE_ROLE_KEY: 'test-key', SUPABASE_URL: 'https://example.invalid' };
const nowAfter = after;

test('script: approves through the existing state function with evidence, once', async () => {
  const { impl, calls } = fakeFetch();
  const result = await runBlogAutoApproval({ date: TODAY, now: nowAfter, env, fetchImpl: impl });
  assert.equal(result.action, 'APPROVE');
  assert.equal(result.written, true);
  const writes = calls.filter((c) => c.url.includes('/rpc/record_content_publication_state'));
  assert.equal(writes.length, 1);
  const body = JSON.parse(writes[0].init.body);
  assert.equal(body.p_status, 'APPROVED');
  assert.equal(body.p_channel, 'blog');
  assert.equal(body.p_slug, 'een-lezersgericht-onderwerp');
  assert.equal(body.p_evidence.auto_approval.veto_window_hours, BLOG_VETO_WINDOW_HOURS);
  assert.match(body.p_evidence.auto_approval.veto_instruction, /evidence\.veto/);
});

test('script: nothing is written inside the window, with a veto, in dry-run, or for stale rows', async () => {
  for (const [label, opts] of [
    ['window', { now: before }],
    ['veto', { fetch: { ob: obligation({ evidence: { veto: { active: true } } }) } }],
    ['dry-run', { dryRun: true }],
    ['stale', { fetch: { ob: obligation({ publication_date: '2026-10-28' }) } }],
  ]) {
    const { impl, calls } = fakeFetch(opts.fetch || {});
    const result = await runBlogAutoApproval({ date: TODAY, now: opts.now || nowAfter, env, fetchImpl: impl, dryRun: opts.dryRun });
    assert.equal(result.written, false, label);
    assert.equal(calls.filter((c) => c.url.includes('/rpc/')).length, 0, label);
  }
});

test('script: a missing service key or a failed write is loud, never silent', async () => {
  await assert.rejects(() => runBlogAutoApproval({ date: TODAY, now: nowAfter, env: {}, fetchImpl: fakeFetch().impl }), /SERVICE_AUTH_NOT_CONFIGURED/);
  await assert.rejects(() => runBlogAutoApproval({ date: TODAY, now: nowAfter, env, fetchImpl: fakeFetch({ writeOk: false }).impl }), /WRITE_FAILED:500/);
});

test('workflow: the approval step runs before the writer step, uses the script and adds no scheduler', () => {
  const text = readFileSync(new URL('../.github/workflows/powerhouse-daily-blog.yml', import.meta.url), 'utf8');
  const approve = text.indexOf('Approve the same-date blog after the veto window');
  const writer = text.indexOf('Reuse the existing writer for this obligation');
  assert.ok(approve > 0 && approve < writer, 'approval step must precede the writer step');
  assert.ok(text.includes('node tools/content-growth/blog-auto-approval.mjs "$DATE"'));
  assert.equal((text.match(/cron:/g) || []).length, 1, 'no second schedule');
});
