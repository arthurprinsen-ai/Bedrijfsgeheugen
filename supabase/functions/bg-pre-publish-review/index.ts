import { createClient } from 'npm:@supabase/supabase-js@2';

const PARENT_CONTRACT = 'channel-identity-hard-gate-v3';
const PERSONAL_CONTRACT = 'arthur-personal-linkedin-identity-v4';
const PERSONAL_CHANNEL = '6a70381699afb44349f0fb35';
const COMPANY_CHANNEL = '6a70381699afb44349f0fb36';
const INSTAGRAM_CHANNEL = '6a70384d99afb44349f0fba9';
const MAX_RULE_AGE_MS = 96 * 60 * 60 * 1000;

const clean = (value: unknown) => String(value ?? '').trim();
const evidenceRefs = (value: any) => Array.isArray(value?.evidence_refs) ? value.evidence_refs.filter((ref: unknown) => clean(ref).length > 0) : [];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});
async function digest(value: string) {
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(data)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const aliases: Record<string, string> = {
  linkedin_personal: 'linkedin_personal', [PERSONAL_CHANNEL]: 'linkedin_personal', arthurprinsen: 'linkedin_personal',
  linkedin_company: 'linkedin_company', [COMPANY_CHANNEL]: 'linkedin_company', bedrijfsgeheugen: 'linkedin_company',
  instagram_company: 'instagram_company', instagram: 'instagram_company', [INSTAGRAM_CHANNEL]: 'instagram_company', 'bedrijfsgeheugen.nl': 'instagram_company',
};

function businessSignal(text: string) {
  return /\b(Bedrijfsgeheugen|directeur(?:en)?|eigenaar(?:s)?|mkb|bedrijf(?:ven|s)?|organisatie(?:s)?|omzet|lead(?:s)?|klant(?:en)?|prospect(?:s)?|strategie|management|consultancy|digitalisering|AI|data|dashboard|frisse blik|scan|afspraak|offerte)\b/i.test(text) || /bedrijfsgeheugen\.nl\/g\//i.test(text);
}
function personalViolations(text: string, body: any, finalHash: string) {
  const out: Array<{ code: string; message: string }> = [];
  const require = (ok: boolean, code: string, message: string) => { if (!ok) out.push({ code, message }); };
  require(!!clean(body.content_id), 'CONTENT_ID_REQUIRED', 'content_id ontbreekt.');
  require(/^\d{4}-\d{2}-\d{2}$/.test(clean(body.calendar_date)), 'CALENDAR_DATE_REQUIRED', 'calendar_date ontbreekt of is ongeldig.');
  require(clean(body.channel_id || body.channel || body.buffer_channel_id) === PERSONAL_CHANNEL, 'CHANNEL_ID_MISMATCH', 'Exact Arthur persoonlijk Buffer-kanaal is verplicht.');
  require(body.channel_kind === 'linkedin_personal', 'CHANNEL_KIND_MISMATCH', 'channel_kind moet linkedin_personal zijn.');
  require(body.identity_contract === PERSONAL_CONTRACT, 'IDENTITY_CONTRACT_MISMATCH', 'Persoonlijk identity-contract ontbreekt.');
  require(body.identity_gate_version === PARENT_CONTRACT, 'IDENTITY_GATE_VERSION_MISMATCH', 'Parent identity-gate ontbreekt.');
  require(body.personal_truth_verified === true, 'PERSONAL_TRUTH_UNVERIFIED', 'De persoonlijke waarheid is niet expliciet geverifieerd.');
  require(Array.isArray(body.source_lineage) ? body.source_lineage.length > 0 : !!body.source_lineage, 'SOURCE_LINEAGE_REQUIRED', 'Bron/evidence-lineage ontbreekt.');
  require(body.arthur_anchor_verified === true, 'ARTHUR_ANCHOR_UNVERIFIED', 'Een geverifieerd Arthur-anker is verplicht.');
  require(body.first_person_claims_verified === true, 'FIRST_PERSON_CLAIMS_UNVERIFIED', 'Eerste-persoonsclaims zijn niet geverifieerd.');
  require(body.personal_life_topic === true, 'PERSONAL_LIFE_TOPIC_REQUIRED', 'Persoonlijk onderwerp is niet bewezen.');
  require(body.business_topic === false, 'BUSINESS_TOPIC_DEFAULT_BLOCK', 'Zakelijk onderwerp is geblokkeerd op Arthur persoonlijk.');
  require(body.corporate_voice === false, 'CORPORATE_VOICE_BLOCKED', 'Corporate/consultantstem is geblokkeerd.');
  require(body.company_page_interchangeable === false, 'COMPANY_PAGE_INTERCHANGEABLE_BLOCKED', 'Tekst mag niet uitwisselbaar zijn met de bedrijfspagina.');
  require(body.forced_business_moral === false, 'FORCED_BUSINESS_MORAL_BLOCKED', 'Geforceerde businessmoraal is geblokkeerd.');
  require(body.prediction_lineage_present === true && !!clean(body.prior_prediction_decision_id), 'PREDICTION_LINEAGE_REQUIRED', 'Prediction/decision-lineage ontbreekt.');
  require(body.publication_intent === 'publish', 'PUBLICATION_INTENT_REQUIRED', 'publication_intent=publish ontbreekt.');
  require(clean(body.final_text_hash) === finalHash, 'FINAL_TEXT_HASH_MISMATCH', 'Final-text hash is niet exact gebonden aan de beoordeelde tekst.');
  if (body.sensitive_private_detail === true && body.sensitive_private_approval !== true) out.push({ code: 'SENSITIVE_PRIVATE_DETAIL_BLOCK', message: 'Privé/sensitief detail vereist exacte goedkeuring.' });
  if (businessSignal(text)) out.push({ code: 'FINAL_TEXT_BUSINESS_SIGNAL_BLOCK', message: 'Uiteindelijke tekst bevat zakelijke/Bedrijfsgeheugen-signalen.' });
  return out;
}
function instagramProofViolations(body: any) {
  const out: Array<{ code: string; message: string }> = [];
  const exactChannel = clean(body.channel_id || body.buffer_channel_id);
  const mediaType = clean(body.media_type).toLowerCase();
  const finalAsset = clean(body.final_asset_url || body.asset_url);
  const visual = body.instagram_visual && typeof body.instagram_visual === 'object' ? body.instagram_visual : null;
  if (exactChannel !== INSTAGRAM_CHANNEL) out.push({ code: 'INSTAGRAM_CHANNEL_ID_MISMATCH', message: 'Exact Instagram Buffer-profiel is verplicht.' });
  if (!clean(body.final_media_sha256)) out.push({ code: 'FINAL_MEDIA_DIGEST_REQUIRED', message: 'Exact finale-media digest ontbreekt.' });
  if (body.exact_final_media_proven !== true) out.push({ code: 'EXACT_FINAL_MEDIA_UNPROVEN', message: 'Exact finale bytes/frames zijn niet bewezen.' });
  if (!finalAsset) out.push({ code: 'INSTAGRAM_FINAL_ASSET_REQUIRED', message: 'Exact final asset URL ontbreekt.' });
  if (!visual || visual.verified !== true || evidenceRefs(visual).length === 0 || !clean(visual.asset_url)) out.push({ code: 'INSTAGRAM_VISUAL_EVIDENCE_REQUIRED', message: 'Geverifieerde visual evidence met evidence_refs en exact asset ontbreekt.' });
  if (visual?.identity_class !== 'mira_daily_life') out.push({ code: 'INSTAGRAM_MIRA_VISUAL_REQUIRED', message: 'Finale media is niet als Mira daily-life geverifieerd.' });
  if (visual?.placeholder_detected === true) out.push({ code: 'INSTAGRAM_PLACEHOLDER_BLOCKED', message: 'Placeholder/broken render is geblokkeerd.' });
  if (finalAsset && clean(visual?.asset_url) && clean(visual.asset_url) !== finalAsset) out.push({ code: 'INSTAGRAM_FINAL_ASSET_MISMATCH', message: 'Geïnspecteerde media is niet exact de finale publicatie-asset.' });
  if (visual?.format_verified !== true) out.push({ code: 'INSTAGRAM_MEDIA_FORMAT_UNVERIFIED', message: 'Publish-format is niet geverifieerd.' });
  if (mediaType === 'reel' || mediaType === 'video') {
    const frames = Array.isArray(visual?.frame_evidence) ? visual.frame_evidence : [];
    const complete = ['start','middle','end'].every((position) => frames.some((frame: any) => frame?.position === position && frame?.verified === true && evidenceRefs(frame).length > 0));
    if (!complete) out.push({ code: 'INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED', message: 'Start-, midden- en eindframe moeten elk geverifieerd bewijs hebben.' });
    if (frames.some((frame: any) => frame?.identity_class !== 'mira_daily_life')) out.push({ code: 'INSTAGRAM_MIRA_FRAME_IDENTITY_REQUIRED', message: 'Elk bewezen videoframe moet Mira daily-life tonen.' });
    if (frames.some((frame: any) => frame?.placeholder_detected === true)) out.push({ code: 'INSTAGRAM_VIDEO_PLACEHOLDER_BLOCKED', message: 'Video bevat placeholder/broken frame.' });
  }
  return out;
}
function otherIdentityViolations(channel: string, text: string, body: any) {
  const out: Array<{ code: string; message: string }> = [];
  if (channel === 'linkedin_company' && /\bik (heb|had|was|ben|ging|kwam|zat|voelde|dacht)\b/i.test(text) && !/\bArthur\b/i.test(text)) out.push({ code: 'COMPANY_CHANNEL_PERSONAL_DIARY_VOICE', message: 'Bedrijfspagina mag niet ongemarkeerd als Arthurs dagboekstem publiceren.' });
  if (channel === 'instagram_company') {
    if (body.mira_gate_passed !== true) out.push({ code: 'MIRA_GATE_NOT_PROVEN', message: 'Mira hard gate ontbreekt.' });
    out.push(...instagramProofViolations(body));
    const mediaType = clean(body.media_type).toLowerCase();
    const source = clean(body.media_source).toLowerCase();
    if ((mediaType === 'reel' || mediaType === 'video') && source !== 'openart') out.push({ code: 'INSTAGRAM_VIDEO_SOURCE_INVALID', message: 'Mira video/reel moet OpenArt zijn.' });
    if (['static','carousel','image'].includes(mediaType) && source !== 'placid') out.push({ code: 'INSTAGRAM_STATIC_SOURCE_INVALID', message: 'Mira static/carousel moet Placid zijn.' });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, can_generate: false, can_publish: false, error: 'METHOD_NOT_ALLOWED' }, 405);
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) return json({ ok: false, can_generate: false, can_publish: false, error: 'SERVER_CONFIG' }, 503);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, can_generate: false, can_publish: false, error: 'INVALID_JSON' }, 400); }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const raw = clean(body.channel || body.channel_id || body.buffer_channel_id).toLowerCase();
  const channel = aliases[raw];
  if (!channel) return json({ ok: false, can_generate: false, can_publish: false, error: 'CHANNEL_REQUIRED_OR_UNKNOWN' }, 422);

  const [{ data: contracts, error: contractError }, { data: rules, error: rulesError }] = await Promise.all([
    db.from('brain_records').select('record_id,status,verified,result').eq('tenant_id','canonical').in('record_id',[PARENT_CONTRACT,PERSONAL_CONTRACT]),
    db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,vertrouwen,status,bijgewerkt_op').eq('status','actief').order('vertrouwen',{ ascending: false }).limit(24),
  ]);
  if (contractError) return json({ ok: false, can_publish: false, error: 'CHANNEL_IDENTITY_CONTRACT_UNAVAILABLE' }, 503);
  const parent = (contracts || []).find((x: any) => x.record_id === PARENT_CONTRACT);
  const personal = (contracts || []).find((x: any) => x.record_id === PERSONAL_CONTRACT);
  if (!parent || parent.status !== 'VERIFIED' || parent.verified !== true || parent.result?.enforcement !== 'FAIL_CLOSED' || !personal || personal.status !== 'VERIFIED' || personal.verified !== true) return json({ ok: false, can_publish: false, error: 'CHANNEL_IDENTITY_CONTRACT_UNAVAILABLE' }, 503);
  if (rulesError || !(rules || []).length) return json({ ok: false, can_publish: false, error: 'RULE_CONTEXT_UNAVAILABLE' }, 503);
  const newest = Math.max(...(rules || []).map((r: any) => Date.parse(r.bijgewerkt_op)).filter(Number.isFinite));
  if (!Number.isFinite(newest) || Date.now() - newest > MAX_RULE_AGE_MS) return json({ ok: false, can_publish: false, error: 'RULE_CONTEXT_STALE' }, 503);

  const text = clean(body.post_text);
  const finalHash = await digest(text);
  if (!text) return json({ ok: true, can_generate: true, can_publish: false, identity_gate_decision: 'BLOCKED_IDENTITY_GATE', channel, final_text_hash: finalHash }, 200);

  const identityBlockers = channel === 'linkedin_personal' ? personalViolations(text, body, finalHash) : otherIdentityViolations(channel, text, body);
  let genericBlockers: any[] = [];
  if (channel !== 'linkedin_personal') {
    const { data: violations, error: ruleError } = await db.rpc('bg_brein_regels_check', {
      p_connectie_id: clean(body.connectie_id) || null,
      p_tekst: text,
      p_haaktype: clean(body.hook_type) || null,
    });
    if (ruleError) return json({ ok: false, can_generate: false, can_publish: false, error: 'RULE_CHECK_FAILED', channel }, 503);
    genericBlockers = (violations || []).filter((v: any) => v.violation);
  }
  const blockers = [...identityBlockers, ...genericBlockers];
  const pass = blockers.length === 0;
  return json({
    ok: pass,
    can_generate: true,
    can_publish: pass,
    identity_gate_decision: pass ? 'PASS' : 'BLOCKED_IDENTITY_GATE',
    identity_gate_version: PARENT_CONTRACT,
    identity_contract: channel === 'linkedin_personal' ? PERSONAL_CONTRACT : PARENT_CONTRACT,
    channel,
    final_text_hash: finalHash,
    violations: blockers,
    personal_truth_verified: channel === 'linkedin_personal' ? body.personal_truth_verified === true : null,
    rule_context: { source_updated_at: new Date(newest).toISOString(), generic_rule_check_applied: channel !== 'linkedin_personal' },
  }, pass ? 200 : 422);
});
