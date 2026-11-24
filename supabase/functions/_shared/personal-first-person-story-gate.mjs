// One original personal publishing authority. Truth is about the user, never a news article
// made to sound like first-person experience. No additional scheduler or post writer.
export const PERSONAL_FIRST_PERSON_STORY_CONTRACT='arthur-verified-personal-story-v1';
export const PERSONAL_LIFE_POLICY='personal-linkedin-personal-life-only-v1';
export const PERSONAL_FOUNDER_PERSPECTIVE_POLICY='personal-linkedin-trusted-advisor-perspective-v1';
const firstPerson=/\b(?:ik|mijn|mij|me)\b/iu;
const businessTopic=/\b(?:Bedrijfsgeheugen|MKB|bedrijven?|organisaties?|klanten?|prospects?|consultancy|consultant|sales|dashboard|omzet|strategie|roadmap|data|AI|automatisering|propositie|offerte|leadgeneratie|management)\b/iu;
const commercialCta=/\b(?:plan een afspraak|boek nu|gratis scan|stuur een dm|download|koop nu|meld je aan)\b/iu;
const userFactOrigin=/\b(?:current-chat:user-fact|chat-history:user-fact|user-submitted-personal|user-verified-personal|user-authored-personal)\b/iu;
const unwantedStoryFamily=/(?:legacy-approved:2026-09-13:printer-vs-haast|verified-chat-bat-2026-09-27|manual-linkedin-personal-2026-09-24-car|rotating-personal-source:2026-09-29|unused-personal-source:2026-10-02)/iu;
const clean=value=>String(value??'').trim();

export function isPersonalPublicationDay(runDate){
 const date=clean(runDate);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const d=new Date(date+'T12:00:00Z');
 return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===date&&d.getUTCDay()!==0;
}
/**
 * Directly user-owned perspective: never infer lived client experience or
 * completed implementation from an external research article or model draft.
 * The source, review and exact final provider-write gates still apply.
 */
export function isVerifiedPersonalFounderPerspective(e={}){
 const lines=Array.isArray(e?.source_lineage)?e.source_lineage.map(clean):[];
 const own=lines.some(x=>userFactOrigin.test(x));
 const kind=['direct_user_stated_opinion','direct_user_stated_design_preference',
   'direct_user_approved_research_synthesis'].includes(clean(e?.founder_view_event_kind));
 const research=e?.research_claims_present===true;
 const sources=Array.isArray(e?.research_source_evidence)?e.research_source_evidence:[];
 const researchVerified=!research||(sources.length>0&&sources.every(v=>
   v?.verified===true&&/^https:\/\/\S+/i.test(clean(v?.url))
   &&Number.isFinite(Date.parse(clean(v?.checked_at)))));
 return e?.personal_founder_perspective_verified===true
   &&e?.personal_founder_perspective_policy===PERSONAL_FOUNDER_PERSPECTIVE_POLICY
   &&e?.founder_view_event_verified===true&&kind&&own
   &&e?.personal_truth_verified===true&&e?.first_person_claims_verified===true
   &&e?.first_person_claims_present===true&&e?.arthur_anchor_verified===true
   &&e?.source_backed===true&&e?.business_topic===true
   &&e?.corporate_voice===false&&e?.company_page_interchangeable===false
   &&e?.forced_business_moral===false&&e?.personal_life_topic===false
   &&e?.ai_native_builder_story_verified!==true
   &&e?.observational_personal_theme_verified!==true
   &&e?.public_theme_source_verified!==true
   &&['verified_personal_source','verified_founder_perspective'].includes(clean(e?.source_kind))
   &&clean(e?.content_id).length>0&&clean(e?.source_text).length>=70
   &&researchVerified;
}

export function personalFirstPersonSourceViolations(evidence={},runDate){
 const e=evidence||{};const out=[];
 const fail=condition=>out.push(condition);
 const builder=e.ai_native_builder_story_verified===true;
 const perspective=isVerifiedPersonalFounderPerspective(e);
 if(!isPersonalPublicationDay(runDate))fail('PERSONAL_SUNDAY_OR_INVALID_DATE');
 if(builder) {
   // First-person technology leadership is permitted ONLY for an independently
   // verified Arthur build event, never a synthetic case, company ad or news.
   if(e.ai_native_builder_policy!=='personal-linkedin-ai-native-builder-v1'
      ||e.build_event_verified!==true||e.arthur_anchor_verified!==true
      ||e.source_backed!==true||e.business_topic!==true
      ||e.corporate_voice!==false||e.company_page_interchangeable!==false
      ||e.forced_business_moral!==false||e.first_person_claims_verified!==true)
     fail('PERSONAL_VERIFIED_BUILDER_SOURCE_REQUIRED');
   if(e.observational_personal_theme_verified===true||e.public_theme_source_verified===true)
     fail('PERSONAL_PUBLIC_NEWS_OR_BUSINESS_FALLBACK_FORBIDDEN');
 } else if(perspective){
   if(e.personal_life_topic!==false||e.business_topic!==true)
     fail('PERSONAL_PERSPECTIVE_SOURCE_SCOPE_FAILED');
 } else {
   if(e.personal_truth_verified!==true||e.arthur_anchor_verified!==true||e.first_person_claims_verified!==true)
     fail('PERSONAL_USER_EXPERIENCE_NOT_VERIFIED');
   if(e.observational_personal_theme_verified===true||e.public_theme_source_verified===true)
     fail('PERSONAL_PUBLIC_NEWS_OR_BUSINESS_FALLBACK_FORBIDDEN');
   if(e.personal_life_topic!==true||e.business_topic!==false||e.corporate_voice!==false||e.company_page_interchangeable!==false||e.forced_business_moral!==false)
     fail('PERSONAL_COMPANY_SEPARATION_REQUIRED');
   if(e.personal_life_only_policy!==PERSONAL_LIFE_POLICY)fail('PERSONAL_LIFE_POLICY_NOT_VERIFIED');
 }
 if(e.sensitive_private_detail===true&&e.sensitive_private_approval!==true)fail('PERSONAL_PRIVATE_DETAIL_NOT_APPROVED');
 const text=clean(e.source_text);
 if(text.length<70)fail('PERSONAL_USER_FACT_SOURCE_TOO_SHORT');
 const lineage=Array.isArray(e.source_lineage)?e.source_lineage.map(clean):[clean(e.source_lineage)];
 if(builder) {
   if(!lineage.some(Boolean))fail('PERSONAL_VERIFIED_BUILD_LINEAGE_REQUIRED');
 } else if(!lineage.some(x=>userFactOrigin.test(x)))fail('PERSONAL_USER_AUTHORED_PROVENANCE_REQUIRED');
 if(lineage.some(x=>/powerhouse_content_artifacts:|powerhouse_mira_problem_signals_v1:|bg_externe_signalen:|google\.com\/goto/i.test(x)))
   fail('PERSONAL_GENERATED_OR_PUBLIC_ARTICLE_SOURCE_FORBIDDEN');
 if(unwantedStoryFamily.test(clean(e.content_id)))fail('PERSONAL_EXCLUDED_OLD_STORY_FAMILY');
 if(!clean(e.content_id))fail('PERSONAL_SOURCE_CONTENT_ID_REQUIRED');
 return [...new Set(out)];
}
// The original 20-Nov user-fact is an authenticated FOUNDER DESIGN DECISION,
// not proof of a personally observed client team, implementation or customer
// result. High-confidence unsupported claims must fail the SAME independent
// copy reviewer and final provider write gate, not just a prompting guideline.
// Other genuine first-hand builder events retain their existing source rules.
export function personalFounderDecisionSourceScopeViolations(text,evidence={}){
 const out=[];
 if(!(evidence?.ai_native_builder_story_verified===true
      &&evidence?.build_event_kind==='founder_directed_verified_product_design_decision_and_merged_delivery')
    &&!isVerifiedPersonalFounderPerspective(evidence))
   return out;
 const copy=String(text??'').trim();
 const source=String(evidence?.source_text??'').toLowerCase();
 const sourceDescribesTeams=/(?:zelf meegemaakt|persoonlijk gezien|eigen team|mijn team|met een klant|klantgesprek|teams die dashboards)/iu.test(source)
   && !/(?:niet geverifieerd|no claim|niet bevestigd)/iu.test(source);
 const sourceProvesOutcome=/(?:klantresultaten? (?:zijn|werd|is) geverifieerd|meetbaar bewezen resultaat|gerealiseerde besparing|snellere inzichten bewezen)/iu.test(source)
   && !/(?:niet geverifieerd|niet gemeten|geen klantresultaat)/iu.test(source);
 // Present-tense frequency and direct observation are firsthand claims too.
 // A founder's design preference does not verify recurring client experience.
 const repeatedObservation=/(?:\b(?:ik|wij)\s+(?:zie[n]?|merk(?:en)?|ervaar|ervaren|hoor|horen)\s+(?:(?:dit|dat|het)\s+)?(?:wekelijks|dagelijks|regelmatig|vaak|telkens|steeds\s+weer)\b|\bwaar\s+(?:ik|wij)\s+(?:(?:vaak|regelmatig|wekelijks|dagelijks|telkens|steeds\s+weer)\s+)?tegenaan\s+(?:loop|lopen)\b|\b(?:ik|wij)\s+(?:zie[n]?|merk(?:en)?|ervaar|ervaren|hoor|horen)\s+bij\s+(?:een\s+)?klant(?:en)?\b)/iu.test(copy);
 if(!sourceDescribesTeams&&repeatedObservation)
   out.push('PERSONAL_FOUNDER_UNVERIFIED_LIVED_TEAM_OR_CLIENT_CLAIM');
 if(!sourceDescribesTeams
   && /(?:\bin de praktijk botste\b|\b(?:ik|mijn|wij)\s+(?:zag|merkte|ervoer|hoorde)\b.{0,120}\b(?:teams|klanten?|processen)\b|\b(?:losse|andere)\s+teams die\b|\bbij een klant\b)/iu.test(copy))
   out.push('PERSONAL_FOUNDER_UNVERIFIED_LIVED_TEAM_OR_CLIENT_CLAIM');
 if(!sourceProvesOutcome && (
   /\bhet resultaat was\b/iu.test(copy)
   || /\b(?:lever(?:t|de|en)|bracht|bespaarde|zorgde voor|leidde tot)\b.{0,80}\b(?:snellere?|betere?|meer|minder|effici[eë]nter|winst|omzet|tijd|geld|resultaten?|inzichten)\b/iu.test(copy)
   || /\bwat ik veranderde\b/iu.test(copy)
 ))out.push('PERSONAL_FOUNDER_UNVERIFIED_IMPLEMENTATION_OR_IMPACT_CLAIM');
 return [...new Set(out)];
}

// One original verified publication day, not a generic URL/CTA relaxation.
// The user explicitly requested that their OWN quarterly magazine be given
// away for free on their personal LinkedIn, with a direct link to its cover page.
// The source, author, destination and date must remain independently checked.
export const ORIGINAL_MAGAZINE_GIFT_CONTENT_ID='user-authored-founder:2026-11-21:de-kloof-q4-free-first-magazine';
export const ORIGINAL_MAGAZINE_GIFT_URL='https://www.bedrijfsgeheugen.nl/de-kloof';
export function isVerifiedPersonalMagazineGift(evidence={}){
 const e=evidence||{};
 return e.content_id===ORIGINAL_MAGAZINE_GIFT_CONTENT_ID
  && e.ai_native_builder_story_verified===true
  && e.ai_native_builder_policy==='personal-linkedin-ai-native-builder-v1'
  && e.build_event_kind==='user_verified_owned_editorial_magazine_public_release'
  && e.build_event_verified===true
  && e.arthur_anchor_verified===true
  && e.source_backed===true
  && e.personal_truth_verified===true
  && e.first_person_claims_verified===true
  && e.business_topic===true
  && e.corporate_voice===false
  && e.company_page_interchangeable===false
  && e.magazine_landing_url===ORIGINAL_MAGAZINE_GIFT_URL
  && e.requested_scheduled_for==='2026-11-21T09:00:00+01:00'
  && String(e.source_text||'').includes('20 november 2026')
  && String(e.source_text||'').includes('21 november 2026')
  && Array.isArray(e.source_lineage)
  && e.source_lineage.some(v=>/^current-chat:user-fact:2026-11-20:saturday-morning-personal-post-free$/.test(String(v||'')));
}
export function magazineGiftLinkIsExact(text,evidence={}){
 if(!isVerifiedPersonalMagazineGift(evidence))return false;
 const urls=String(text??'').match(/https?:\/\/[^\s]+/giu)||[];
 return urls.length===1&&urls[0]===ORIGINAL_MAGAZINE_GIFT_URL;
}

export function personalFirstPersonCopyViolations(text,evidence={},runDate){
 const out=personalFirstPersonSourceViolations(evidence,runDate);
 const perspective=isVerifiedPersonalFounderPerspective(evidence);
 const body=clean(text);
 out.push(...personalFounderDecisionSourceScopeViolations(body,evidence));
 if(!firstPerson.test(body.slice(0,260)))out.push('PERSONAL_FIRST_PERSON_OPENING_REQUIRED');
 if(evidence?.ai_native_builder_story_verified!==true&&!perspective&&businessTopic.test(body))out.push('PERSONAL_COMPANY_COPY_NOT_ALLOWED');
 if(commercialCta.test(body))out.push('PERSONAL_SALES_CTA_NOT_ALLOWED');
 // LinkedIn 2026: reject narrow explicit engagement bait while allowing
 // sincere, source-relevant questions and debate. This applies at the original
 // independent source/copy and last-mile provider gates, never as a bypass.
 if(/\b(?:typ|reageer\s+met|comment)\s+['"“”]?(?:JA|NEE|EENS|ONEENS|1|2|3)['"“”]?(?=\s|[.!,?]|$)|\b(?:like\s+als|tag\s+iemand|deel\s+deze\s+post|volg\s+mij\s+voor)\b/iu.test(body))
   out.push('PERSONAL_ENGAGEMENT_BAIT_NOT_ALLOWED');
 if(/#[\p{L}\p{N}_]+/u.test(body))out.push('PERSONAL_HASHTAGS_NOT_ALLOWED');
 if(/https?:\/\/|www\./iu.test(body)&&!magazineGiftLinkIsExact(body,evidence))out.push('PERSONAL_PROMOTIONAL_URL_NOT_ALLOWED');
 if(!/\b(?:stond|zat|liep|reed|ging|kwam|probeerde|vergat|wachtte|zocht|bracht|haalde|belde|sprak|keek|dacht|dacht ik|maakte|kreeg|zei|had|heb|ben|was|sta|ga|doe|reed|coach|vertelde|zag|bouw|bouwde|bouwen|gebouwd|ontwikkel|ontwikkelde|ontwerp|ontwierp|implementeer|implementeerde|automatiseer|automatiseerde|testte|vind|vond|kies|koos|geloof|besloot|leer|leerde)\b/iu.test(body))
   out.push('PERSONAL_CONCRETE_OWN_MOMENT_REQUIRED');
 return [...new Set(out)];
}

/**
 * Final, channel-specific security boundary before a personal LinkedIn provider write.
 * A historical approval, a post-create readback, or an accepted news source never
 * substitutes for a PASS on the identical final text and a verified user fact.
 * The existing publisher owns the only transport; this does not create a sender.
 */
export function personalLastMilePublicationViolations({
  text='', evidence={}, runDate='', review=null,
  expectedTextHash='', actualTextHash='', sourceVerified=false
}={}) {
  const failures=personalFirstPersonCopyViolations(text,evidence,runDate);
  if(sourceVerified!==true)failures.push('PERSONAL_SOURCE_REVISION_NOT_VERIFIED');
  if(review?.http!==200 || review?.can_publish!==true ||
     review?.identity_gate_decision!=='PASS' ||
     review?.final_text_hash!==actualTextHash)
    failures.push('PERSONAL_EXACT_REVIEW_PASS_REQUIRED');
  if(!/^[a-f0-9]{64}$/.test(clean(actualTextHash)) ||
     clean(expectedTextHash)!==clean(actualTextHash) ||
     clean(evidence?.final_text_hash)!==clean(actualTextHash))
    failures.push('PERSONAL_FINAL_TEXT_HASH_NOT_BOUND');
  return [...new Set(failures)];
}
