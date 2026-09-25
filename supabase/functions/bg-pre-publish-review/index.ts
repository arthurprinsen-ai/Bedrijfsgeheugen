import { createClient } from 'npm:@supabase/supabase-js@2';

const PARENT_CONTRACT = 'channel-identity-hard-gate-v3';
const PERSONAL_CONTRACT = 'arthur-personal-linkedin-identity-v4';
const PERSONAL_CHANNEL = '6a70381699afb44349f0fb35';
const PERSONAL_LIFE_ONLY_POLICY = 'personal-linkedin-personal-life-only-v1';
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
  return /\b(Bedrijfsgeheugen|directeur(?:en)?|eigenaar(?:s)?|mkb|bedrijf(?:ven|s)?|organisatie(?:s)?|omzet|lead(?:s)?|klant(?:en)?|prospect(?:s)?|strategie|management|consultancy|consultant|digitalisering|AI|data|dashboard|frisse blik|scan|afspraak|offerte|sales|business|propositie|dienstverlening|case|cases|opdrachtgever|opdrachtgevers|werkgever|werkgevers|teamlead|stakeholder|roadmap|governance)\b/i.test(text) || /bedrijfsgeheugen\.nl\/g\//i.test(text);
}
function concretePersonalLifeSignal(text: string) {
  const firstPerson = /\b(ik|mijn|mij|me|voor mij|bij mij)\b/i.test(text);
  const context = /\b(thuis|vanochtend|vanmorgen|vanmiddag|vanavond|vannacht|vandaag|gisteren|weekend|vakantie|hockey|wedstrijd|training|tuin|auto|fiets|trein|school|kind(?:eren)?|dochter|zoon|gezin|boodschappen|supermarkt|printer|telefoon|laptop|robotstofzuiger|file|regen|keuken|straat|buurt|verjaardag|restaurant|wandeling|sport)\b/i.test(text);
  const action = /\b(stond|zat|liep|reed|ging|kwam|probeerde|vergat|wachtte|zocht|bracht|haalde|belde|sprak|keek|baalde|lachte|schrok|voelde|dacht ineens)\b/i.test(text);
  const ownedConcrete = /\bmijn\s+(kind|dochter|zoon|gezin|auto|fiets|tuin|telefoon|printer|weekend|vakantie|training|wedstrijd)\b/i.test(text);
  return firstPerson && ((context && action) || ownedConcrete);
}
function consultantVoiceSignal(text: string) {
  return /\b(thought leadership|best practice|proces(?:sen)? slimmer|effici[eë]nter werken|waarde creëren|transformatie|governance|roadmap|stakeholder|executie|implementatie|optimaliseren|schaalbaar|future.?proof|leiderschap|strategie concreet maken)\b/i.test(text)
    || /\b(dit geldt ook voor organisaties|de les voor bedrijven|wat organisaties hiervan kunnen leren|in mijn werk zie ik|bij een klant|voor leiders|managementles|de les is|wat we hiervan kunnen leren|dit leert mij dat)\b/i.test(text);
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
  require(body.personal_life_only_policy === PERSONAL_LIFE_ONLY_POLICY, 'PERSONAL_LIFE_ONLY_POLICY_REQUIRED', 'De personal-life-only policy ontbreekt of is verouderd.');
  require(body.personal_life_only_verified === true, 'PERSONAL_LIFE_ONLY_UNVERIFIED', 'De uiteindelijke tekst is niet expliciet als uitsluitend persoonlijk leven geverifieerd.');
  require(concretePersonalLifeSignal(text), 'FINAL_TEXT_CONCRETE_PERSONAL_EVENT_REQUIRED', 'De uiteindelijke tekst moet zelf een concrete persoonlijke gebeurtenis of dagelijkse ervaring bevatten; metadata alleen is onvoldoende.');
  require(body.business_topic === false, 'BUSINESS_TOPIC_DEFAULT_BLOCK', 'Zakelijk onderwerp is geblokkeerd op Arthur persoonlijk.');
  require(body.corporate_voice === false, 'CORPORATE_VOICE_BLOCKED', 'Corporate/consultantstem is geblokkeerd.');
  require(body.company_page_interchangeable === false, 'COMPANY_PAGE_INTERCHANGEABLE_BLOCKED', 'Tekst mag niet uitwisselbaar zijn met de bedrijfspagina.');
  require(body.forced_business_moral === false, 'FORCED_BUSINESS_MORAL_BLOCKED', 'Geforceerde businessmoraal is geblokkeerd.');
  require(body.prediction_lineage_present === true && !!clean(body.prior_prediction_decision_id), 'PREDICTION_LINEAGE_REQUIRED', 'Prediction/decision-lineage ontbreekt.');
  require(body.publication_intent === 'publish', 'PUBLICATION_INTENT_REQUIRED', 'publication_intent=publish ontbreekt.');
  require(clean(body.final_text_hash) === finalHash, 'FINAL_TEXT_HASH_MISMATCH', 'Final-text hash is niet exact gebonden aan de beoordeelde tekst.');
  if (body.sensitive_private_detail === true && body.sensitive_private_approval !== true) out.push({ code: 'SENSITIVE_PRIVATE_DETAIL_BLOCK', message: 'Privé/sensitief detail vereist exacte goedkeuring.' });
  if (businessSignal(text)) out.push({ code: 'FINAL_TEXT_BUSINESS_SIGNAL_BLOCK', message: 'Uiteindelijke tekst bevat zakelijke/Bedrijfsgeheugen-signalen.' });
  if (consultantVoiceSignal(text)) out.push({ code: 'FINAL_TEXT_CONSULTANT_VOICE_BLOCK', message: 'Uiteindelijke tekst klinkt als consultant/thought-leadership of forceert een zakelijke moraal.' });
  return out;
}
function hasVisionEvidence(value: any) {
  return evidenceRefs(value).some((ref: string) => /^vision:/i.test(ref));
}
function isVisibleMiraProof(value: any) {
  return value?.verified === true
    && value?.semantic_verified === true
    && value?.mira_present === true
    && clean(value?.identity_class) === 'mira_daily_life'
    && clean(value?.evidence_method).toLowerCase() === 'vision'
    && hasVisionEvidence(value);
}
function instagramProofViolations(body: any) {
  const out: Array<{ code: string; message: string }> = [];
  const exactChannel = clean(body.channel_id || body.buffer_channel_id);
  const mediaType = clean(body.media_type).toLowerCase();
  const finalAsset = clean(body.final_asset_url || body.asset_url || body.media_url);
  const visual = body.instagram_visual && typeof body.instagram_visual === 'object' ? body.instagram_visual : null;
  const width = Number(visual?.width);
  const height = Number(visual?.height);
  if (exactChannel !== INSTAGRAM_CHANNEL) out.push({ code: 'INSTAGRAM_CHANNEL_ID_MISMATCH', message: 'Exact Instagram Buffer-profiel is verplicht.' });
  if (!clean(body.final_media_sha256)) out.push({ code: 'FINAL_MEDIA_DIGEST_REQUIRED', message: 'Exact finale-media digest ontbreekt.' });
  if (body.exact_final_media_proven !== true) out.push({ code: 'EXACT_FINAL_MEDIA_UNPROVEN', message: 'Exact finale bytes/frames zijn niet bewezen.' });
  if (!finalAsset) out.push({ code: 'INSTAGRAM_FINAL_ASSET_REQUIRED', message: 'Exact final asset URL ontbreekt.' });
  if (!visual || !clean(visual.asset_url) || evidenceRefs(visual).length === 0) out.push({ code: 'INSTAGRAM_VISUAL_EVIDENCE_REQUIRED', message: 'Visual evidence met evidence_refs en exact asset ontbreekt.' });
  if (visual && !isVisibleMiraProof(visual)) out.push({ code: 'INSTAGRAM_MIRA_VISIBLE_IDENTITY_REQUIRED', message: 'Mira moet aantoonbaar zichtbaar zijn in de finale pixels; template-, layer- of caller-metadata is geen identiteitsbewijs.' });
  if (visual?.placeholder_detected === true) out.push({ code: 'INSTAGRAM_PLACEHOLDER_BLOCKED', message: 'Placeholder/broken render is geblokkeerd.' });
  if (finalAsset && clean(visual?.asset_url) && clean(visual.asset_url) !== finalAsset) out.push({ code: 'INSTAGRAM_FINAL_ASSET_MISMATCH', message: 'Geïnspecteerde media is niet exact de finale publicatie-asset.' });
  if (visual?.format_verified !== true) out.push({ code: 'INSTAGRAM_MEDIA_FORMAT_UNVERIFIED', message: 'Publish-format is niet geverifieerd.' });
  if (mediaType === 'reel' || mediaType === 'video') {
    if (width !== 1080 || height !== 1920) out.push({ code: 'INSTAGRAM_REEL_DIMENSIONS_INVALID', message: 'Mira reel/video moet exact 1080x1920 zijn.' });
    const frames = Array.isArray(visual?.frame_evidence) ? visual.frame_evidence : [];
    const complete = ['start','middle','end'].every((position) => frames.some((frame: any) => frame?.position === position && isVisibleMiraProof(frame)));
    if (!complete) out.push({ code: 'INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED', message: 'Start-, midden- en eindframe moeten elk vision-geverifieerd zichtbaar Mira-bewijs hebben.' });
    if (frames.some((frame: any) => frame?.placeholder_detected === true)) out.push({ code: 'INSTAGRAM_VIDEO_PLACEHOLDER_BLOCKED', message: 'Video bevat placeholder/broken frame.' });
    const temporal = visual?.temporal_proof || body?.temporal_proof || {};
    const temporalRefs = evidenceRefs(temporal);
    const temporalPass = temporal?.verified === true
      && temporal?.single_continuous_take === true
      && temporal?.continuous_motion_verified === true
      && temporal?.scene_continuity_verified === true
      && temporal?.identity_continuity_verified === true
      && temporal?.human_motion_verified === true
      && temporal?.realistic_camera_motion === true
      && temporal?.slideshow_detected === false
      && temporal?.still_image_animation_detected === false
      && ['vision','manual_vision'].includes(clean(temporal?.evidence_method).toLowerCase())
      && temporalRefs.some((ref: string) => /^temporal:/i.test(ref));
    if (!temporalPass) out.push({ code: 'INSTAGRAM_CONTINUOUS_HUMAN_VIDEO_REQUIRED', message: 'Mira Reel moet één doorlopende, menselijk bewegende video zijn; slideshow/still-image-animation of montageachtig beeld is geblokkeerd.' });
  } else {
    if (width !== 1080 || height !== 1350) out.push({ code: 'INSTAGRAM_STATIC_DIMENSIONS_INVALID', message: 'Mira feed-afbeelding moet exact 1080x1350 zijn.' });
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
    if (['static','image'].includes(mediaType) && !['placid','openart'].includes(source)) out.push({ code: 'INSTAGRAM_IMAGE_SOURCE_INVALID', message: 'Mira image moet OpenArt of Placid zijn.' });
    if (mediaType === 'carousel') {
      const slides = Array.isArray(body.carousel_manifest?.slides) ? body.carousel_manifest.slides : [];
      if (slides.length < 2) out.push({ code: 'INSTAGRAM_CAROUSEL_MANIFEST_REQUIRED', message: 'Carousel vereist minimaal twee bewezen slides.' });
      for (const slide of slides) {
        const sp = clean(slide?.provider).toLowerCase(), sk = clean(slide?.kind || 'image').toLowerCase();
        if (sk === 'video' && sp !== 'openart') out.push({ code: 'INSTAGRAM_CAROUSEL_VIDEO_OPENART_REQUIRED', message: 'Video-slide in carousel moet OpenArt zijn.' });
        if (sk === 'image' && !['openart','placid'].includes(sp)) out.push({ code: 'INSTAGRAM_CAROUSEL_IMAGE_PROVIDER_INVALID', message: 'Image-slide in carousel moet OpenArt of Placid zijn.' });
        if (!clean(slide?.asset_url) || !clean(slide?.sha256) || slide?.proof?.identity_gate_result !== 'PASS') out.push({ code: 'INSTAGRAM_CAROUSEL_SLIDE_PROOF_REQUIRED', message: 'Iedere carousel-slide vereist exact asset + PASS proof.' });
      }
    }
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
  if (channel === 'linkedin_company') {
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
    personal_life_only_policy: channel === 'linkedin_personal' ? PERSONAL_LIFE_ONLY_POLICY : null,
    personal_life_only_verified: channel === 'linkedin_personal' ? body.personal_life_only_verified === true : null,
    rule_context: { source_updated_at: new Date(newest).toISOString(), generic_rule_check_applied: channel === 'linkedin_company' },
  }, pass ? 200 : 422);
});