import { createHash } from 'node:crypto';
import { deliveryDecision, normalizeText } from '../../platform/social-delivery-guarantee.mjs';
import { CHANNELS as SOCIAL_CHANNELS, authorizeSocialPublication } from '../../platform/social-channel-identity-gate.mjs';

const BUFFER_URL = 'https://api.buffer.com';
const ORGANIZATION_ID = process.env.BUFFER_ORGANIZATION_ID || '6a7037d2d8fce064ac755ec7';
const CHANNELS = Object.freeze({
  linkedin_personal: process.env.BUFFER_LINKEDIN_PERSONAL_CHANNEL_ID || '6a70381699afb44349f0fb35',
  linkedin_company: process.env.BUFFER_LINKEDIN_COMPANY_CHANNEL_ID || '6a70381699afb44349f0fb36',
  instagram: process.env.BUFFER_INSTAGRAM_CHANNEL_ID || '6a70384d99afb44349f0fba9',
});
const SUPABASE_EDGE_URL = (process.env.BG_PORTAL_EU_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const POWERHOUSE_TOKEN = process.env.BG_PORTAL_EU_SERVICE_TOKEN || process.env.POWERHOUSE_SHARED_SECRET || process.env.POWERHOUSE_TOKEN || '';
const BUFFER_API_KEY = process.env.BUFFER_API_KEY || '';
const REQUIRED_CHANNELS = Object.keys(CHANNELS);
const STATE_RANK = Object.freeze({ PLANNED:10, GENERATED:20, APPROVED:30, DISPATCHED:40, PUBLISHED:50, LIVE_PROVEN:60, MEASURED:70, LEARNED:80, BLOCKED:90, FAILED:90 });

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type':'application/json', 'cache-control':'no-store' } });
const sha256 = (value) => createHash('sha256').update(String(value || '')).digest('hex');

function amsterdamParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Amsterdam', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', hour12:false }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return { date:`${p.year}-${p.month}-${p.day}`, hour:Number(p.hour) };
}

function offsetMinutesAt(date, timeZone = 'Europe/Amsterdam') {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName:'longOffset', hour:'2-digit' })
    .formatToParts(date).find((p) => p.type === 'timeZoneName')?.value || 'GMT+00:00';
  const match = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -minutes : minutes;
}

export function localMidnightUtc(dateString, timeZone = 'Europe/Amsterdam') {
  const base = Date.parse(`${dateString}T00:00:00Z`);
  let instant = new Date(base);
  for (let i = 0; i < 3; i += 1) instant = new Date(base - offsetMinutesAt(instant, timeZone) * 60_000);
  return instant.toISOString();
}

function nextDate(dateString) {
  const d = new Date(`${dateString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function localDayWindow(dateString) {
  return { start:localMidnightUtc(dateString), end:localMidnightUtc(nextDate(dateString)) };
}

async function buffer(payload) {
  if (!BUFFER_API_KEY) throw new Error('BUFFER_API_KEY_REQUIRED');
  const response = await fetch(BUFFER_URL, { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${BUFFER_API_KEY}` }, body:JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`BUFFER_HTTP_${response.status}`);
  if (Array.isArray(body?.errors) && body.errors.length) throw new Error(`BUFFER_GRAPHQL:${body.errors.map((x) => x?.message || 'unknown').join('|')}`);
  return body?.data || {};
}

async function getProviderPosts(dateString) {
  const { start, end } = localDayWindow(dateString);
  const query = `query DailyPosts($start: DateTime!, $end: DateTime!) { posts(first: 100, input: { organizationId: "${ORGANIZATION_ID}", filter: { status: [scheduled, sending, sent, error], channelIds: [${Object.values(CHANNELS).map((x) => `"${x}"`).join(',')}], dueAt: { gte: $start, lt: $end } }, sort: [{ field: dueAt, direction: asc }] }) { edges { node { id status text dueAt sentAt channelId } } } }`;
  const data = await buffer({ query, variables:{ start, end } });
  return (data?.posts?.edges || []).map((x) => x?.node).filter(Boolean);
}

async function getIdeas() {
  const query = `query DailyIdeas { ideas(first: 100, input: { organizationId: "${ORGANIZATION_ID}" }) { edges { node { id content { title text date services } } } } }`;
  const data = await buffer({ query });
  return (data?.ideas?.edges || []).map((x) => x?.node).filter(Boolean);
}

async function powerhouse(action, payload = {}) {
  if (!SUPABASE_EDGE_URL || !POWERHOUSE_TOKEN) throw new Error('POWERHOUSE_DELIVERY_CONFIG_REQUIRED');
  const response = await fetch(`${SUPABASE_EDGE_URL}/functions/v1/content-operations`, { method:'POST', headers:{ 'content-type':'application/json', 'x-powerhouse-token':POWERHOUSE_TOKEN }, body:JSON.stringify({ action, ...payload }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) throw new Error(body?.error || `POWERHOUSE_HTTP_${response.status}`);
  return body;
}

function sameDate(value, dateString) { return String(value || '').slice(0, 10) === dateString; }
function ideaForCompany(ideas, dateString) {
  return ideas.find((idea) => sameDate(idea?.content?.date, dateString) && new Set(idea?.content?.services || []).has('linkedin') && /^BEDRIJF\b/i.test(String(idea?.content?.title || ''))) || null;
}

function toAssets(media = []) {
  return media.map((item) => item.type === 'video' ? { video:{ url:item.url } } : { image:{ url:item.url, ...(item.alt ? { metadata:{ altText:item.alt } } : {}) } });
}

export function providerReconciliationState(obligationStatus, providerStatus) {
  const current = STATE_RANK[String(obligationStatus || 'PLANNED')] ?? 0;
  const provider = String(providerStatus || '').toLowerCase();
  if (provider === 'sent' && current < STATE_RANK.LIVE_PROVEN) return 'LIVE_PROVEN';
  if (['scheduled','sending'].includes(provider) && current < STATE_RANK.DISPATCHED) return 'DISPATCHED';
  return null;
}

function authorizeInstagramSource(source) {
  const gateInput = source?.artifact?.generation_evidence?.instagram_publish_gate_input;
  if (!gateInput) return { authorized:false, reasons:['INSTAGRAM_MIRA_ARTIFACT_REQUIRED'] };
  return authorizeSocialPublication({
    ...gateInput,
    channelKind:'instagram_company',
    channelId:SOCIAL_CHANNELS.instagram_company.channelId,
    text:source.text,
    companyPageInterchangeable:false,
  });
}

async function createProviderPost(channel, source, hour) {
  if (channel === 'instagram') {
    const auth = authorizeInstagramSource(source);
    if (!auth.authorized) throw new Error(`INSTAGRAM_MIRA_GATE_BLOCKED:${auth.reasons.join(',')}`);
  }
  const input = {
    text:source.text,
    channelId:CHANNELS[channel],
    schedulingType:'automatic',
    mode:hour >= 17 ? 'shareNow' : 'addToQueue',
    ...(source.kind === 'idea' && source.ideaId ? { ideaId:source.ideaId } : {}),
    ...(source.media.length ? { assets:toAssets(source.media) } : {}),
    ...(channel === 'instagram' ? { metadata:{ instagram:{ type:source.media.some((x) => x.type === 'video') ? 'reel' : 'post', shouldShareToFeed:true, isAiGenerated:true } } } : {}),
  };
  const query = `mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { ... on PostActionSuccess { post { id status text dueAt sentAt channelId } } ... on MutationError { message } } }`;
  const data = await buffer({ query, variables:{ input } });
  const result = data?.createPost;
  if (!result?.post?.id) throw new Error(`BUFFER_CREATE_FAILED:${result?.message || 'missing_post'}`);
  return result.post;
}

async function recordState({ date, channel, status, providerPost = null, reason = null, source = null }) {
  const evidence = {
    delivery_guard:'social-delivery-guarantee-v1', provider:'buffer', provider_status:providerPost?.status || null,
    provider_post_id:providerPost?.id || null, provider_due_at:providerPost?.dueAt || null, sent_at:providerPost?.sentAt || null,
    content_hash:source?.text ? sha256(normalizeText(source.text)) : null, source_kind:source?.kind || null, readback_at:new Date().toISOString(),
  };
  await powerhouse('record_delivery_state', {
    date, channel, status,
    contentId:providerPost?.id ? `buffer:${providerPost.id}` : null,
    externalId:providerPost?.id || null,
    evidence,
    nextAction:status === 'LIVE_PROVEN' ? 'Measure outcome and feed learning loop.' : reason || 'Verify provider readback.',
    error:['BLOCKED','FAILED'].includes(status) ? reason : null,
  });
}

export async function runSocialPublicationDelivery({ now = new Date() } = {}) {
  const local = amsterdamParts(now);
  if (local.hour < 7 || local.hour > 20) return { ok:true, skipped:'OUTSIDE_DELIVERY_WINDOW', date:local.date };
  const context = await powerhouse('delivery_context', { date:local.date });
  const obligations = context.obligations || [];
  const artifacts = context.artifacts || [];
  let posts = await getProviderPosts(local.date);
  const ideas = await getIdeas();
  const results = [];

  for (const channel of REQUIRED_CHANNELS) {
    const obligation = obligations.find((x) => x.channel === channel);
    if (!obligation) { results.push({ channel, action:'BLOCK', reason:'OBLIGATION_REQUIRED' }); continue; }
    const channelPosts = posts.filter((x) => x.channelId === CHANNELS[channel]);
    const artifact = artifacts.find((x) => x.channel === channel) || null;
    const idea = channel === 'linkedin_company' ? ideaForCompany(ideas, local.date) : null;
    const decision = deliveryDecision({ channel, posts:channelPosts, artifact, idea });

    if (decision.action === 'NONE') {
      const providerPost = channelPosts.find((x) => ['sent','sending','scheduled'].includes(String(x.status).toLowerCase())) || null;
      const nextState = providerPost ? providerReconciliationState(obligation.status, providerPost.status) : null;
      if (nextState) await recordState({ date:local.date, channel, status:nextState, providerPost, source:artifact ? { kind:'artifact', text:artifact.body } : null });
      results.push({ channel, action:'NONE', reason:decision.reason, providerStatus:providerPost?.status || null, reconciledTo:nextState });
      continue;
    }

    if (decision.action === 'BLOCK') {
      if (!['BLOCKED','FAILED'].includes(obligation.status)) await recordState({ date:local.date, channel, status:'BLOCKED', reason:decision.reason });
      results.push({ channel, ...decision });
      continue;
    }

    const created = await createProviderPost(channel, decision.source, local.hour);
    posts = await getProviderPosts(local.date);
    const readback = posts.find((x) => x.id === created.id) || created;
    if (!['scheduled','sending','sent'].includes(String(readback.status).toLowerCase())) throw new Error(`PROVIDER_READBACK_NOT_COVERED:${channel}:${readback.status}`);
    if (channel === 'linkedin_personal' && normalizeText(readback.text) !== normalizeText(decision.source.text)) throw new Error('PERSONAL_PROVIDER_TEXT_MISMATCH');
    await recordState({ date:local.date, channel, status:String(readback.status).toLowerCase() === 'sent' ? 'LIVE_PROVEN' : 'DISPATCHED', providerPost:readback, source:decision.source });
    results.push({ channel, action:'CREATE', providerId:readback.id, providerStatus:readback.status });
  }
  return { ok:true, date:local.date, results };
}

export default async function handler() {
  try { return json(await runSocialPublicationDelivery()); }
  catch (error) { console.error('SOCIAL_PUBLICATION_DELIVERY_FAILED', error); return json({ ok:false, error:'SOCIAL_PUBLICATION_DELIVERY_FAILED', message:error?.message || String(error) }, 503); }
}

export const config = { schedule:'5 * * * *' };
