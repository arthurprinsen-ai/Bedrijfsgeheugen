// Canonical Notion: "Skill — Persoonlijk LinkedIn: persoonlijke ondernemersreis & leven"
// and "Persoonlijk profiel — wat er wel en niet op mag" (read 2026-10-10).
// This is a deterministic delivery veto, NOT a substitute for source verification.
import {isVerifiedPersonalMagazineGift,magazineGiftLinkIsExact} from './personal-first-person-story-gate.mjs';
export const PERSONAL_EDITORIAL_POLICY = 'personal-linkedin-founder-editorial-v4';

// Shared source of truth: pre-publication and generator use the same personal
// business-language veto. AI/data are allowed only in the observational submode
// when the original policy permits them; verified builder mode uses separate gates.
export function personalNonBuilderBusinessSignal(value,{observational=false}={}) {
  const text=String(value??'');
  const common=/\b(Bedrijfsgeheugen|directeur(?:en)?|eigenaar(?:s)?|mkb|bedrijf(?:ven|s)?|organisatie(?:s)?|omzet|lead(?:s)?|klant(?:en)?|prospect(?:s)?|strategie|management|consultancy|consultant|digitalisering|dashboard|frisse blik|scan|afspraak|offerte|sales|business|propositie|dienstverlening|case|cases|opdrachtgever|opdrachtgevers|werkgever|werkgevers|teamlead|stakeholder|roadmap|governance)\b/i.test(text) || /bedrijfsgeheugen\.nl\/g\//i.test(text);
  return common || (!observational && /\b(AI|data)\b/i.test(text));
}

// The original personal generator and independent final reviewer MUST use one
// exact daily-life lexical gate. A verified observational online-order source
// may legitimately say 'onlinebestelling', 'klantenservice' or 'webwinkel'.
// This predicate alone does NOT authorize a source, text or publication.
export function personalObservationalLifeContextSignal(value) {
  const text=String(value??'');
  return /\b(thuis|telefoon|app|wandeling|winkel|boodschappen|supermarkt|auto|fiets|trein|school|sport|weekend|vakantie|keuken|straat|buurt|regen|pakket|bezorging|scherm|offline|onlinebestelling|klantenservice|webwinkel)\b/i.test(text);
}

export function personalEditorialViolations(value, evidence={}) {
  const text=String(value??'').trim();
  const out=[];
  const fail=(code,reason)=>out.push({code,message:reason});
  const builder=evidence?.ai_native_builder_story_verified===true;
  const observation=evidence?.observational_personal_theme_verified===true&&!builder;
  if(!builder&&personalNonBuilderBusinessSignal(text,{observational:observation}))
    fail('PERSONAL_EDITORIAL_PREPUBLISH_BUSINESS_SIGNAL','Niet-bouwverhaal bevat zakelijke taal die de definitieve LinkedIn-controle afkeurt.');
  // No fixed word target. Source-led personal stories may be short or long.
  if(/(?:\*\*|__|(^|\n)\s*#{1,6}\s|(^|\n)\s*(?:-{3,}|\*{3,}|_{3,})\s*(?=\n|$)|(^|\n)\s*[-•]\s|\x60{3,}|\*(?=\S))/u.test(text))
    fail('PERSONAL_EDITORIAL_MARKDOWN','Verwijder zichtbare Markdown- en documentopmaak. LinkedIn-tekst is platte tekst.');
  if(/https?:\/\/|www\./i.test(text)&&!magazineGiftLinkIsExact(text,evidence))
    fail('PERSONAL_EDITORIAL_URL','Een persoonlijk oprichtersverhaal bevat geen directe link in de post, behalve de exact bewezen gratis eigen magazinepublicatie.');
  if((text.match(/#[\p{L}\p{N}_]+/gu)||[]).length>3)
    fail('PERSONAL_EDITORIAL_HASHTAG_COUNT','Gebruik maximaal drie hashtags.');
  if(/\p{Extended_Pictographic}/u.test(text)&&!(isVerifiedPersonalMagazineGift(evidence)&&/^Goedemorgen en een fijne zaterdag! ☕\s*\n/iu.test(text)&&((text.match(/\p{Extended_Pictographic}/gu)||[]).length===1)))
    fail('PERSONAL_EDITORIAL_EMOJI','Geen emoji in persoonlijke profieltekst buiten exact geverifieerde zaterdaggroet voor eigen gratis magazine.');
  if(/\b(?:pipeline|runtime|heartbeat|readback|provider[- ]?(?:receipt|id|bewijs)|debug|supabase|github|netlify|postgres|sql|api[- ]?request|statuscode|bewakingscycli|systeemstatus|technische status|groen(?:e)? (?:status|bewaking)|bronbewijs|feedbacklus|intelligentiela(?:ag|gen)[a-z]*)\b/iu.test(text))
    fail('PERSONAL_EDITORIAL_TECHNICAL_STATUS','Vertaal interne technische status naar één concreet menselijk gevolg.');
  // 2026-11-01: the real published personal post was a developer-style status
  // report (273 measured pages, 30 sources, 280 queued actions, 22 executed,
  // assurance amber/red loops). Existing identity and length gates alone missed it.
  // Neither the original source metadata nor a truthful counter makes this a
  // relevant founder story for buyers. Reject BEFORE final artifact approval.
  const opening=text.slice(0,190);
  if(/^\s*(?:ik wil dat ai niet alleen|ik wil dat (?:ai|kunstmatige intelligentie) (?:meer|beter)|mijn doel is om ai)/iu.test(opening))
    fail('PERSONAL_EDITORIAL_GENERIC_AI_HOOK','Begin bij een herkenbaar menselijk of ondernemersprobleem, niet bij een generieke AI-missie.');
  if(/\b(?:assurance[- ]controle|amber (?:signalen|loops)|rode (?:en|of) amber signalen|actieve loops|goedkeurde ai[- ]modellen|acties klaargezet|gemeten pagina.s|bron[- ]verversing)\b/iu.test(text)||
     (text.match(/\b\d+(?:[.,]\d+)?\s+(?:bronnen|pagina.s|modellen|acties|signalen|loops)\b/giu)||[]).length>=2)
    fail('PERSONAL_EDITORIAL_INTERNAL_METRICS_REPORT','Vertaal interne operationele tellers naar een concrete klant- of ondernemerssituatie; geen statusdump.');
  if(builder && !/\b(?:klant(?:en)?|ondernemer(?:s)?|bedrijf|bedrijven|omzet|offert(?:e|es)|factur(?:en|atie)|kosten|verlies|tijd|planning|risico|marge|werkdruk|medewerker(?:s)?)\b/iu.test(text.slice(0,270)))
    fail('PERSONAL_EDITORIAL_BUYER_RELEVANT_OPENING','Maak het praktische probleem voor een ondernemer zichtbaar in de eerste regels.');
  if(/\b(?:blog (?:stond|staat) live|e-?mail (?:werd|is) (?:verstuurd|verzonden)|informatie ging uit|verzonden,? bewezen|acties zijn uitgegaan)\b/iu.test(text))
    fail('PERSONAL_EDITORIAL_DELIVERY_REPORT','Interne verzending en publicatiestatus zijn geen persoonlijk verhaal.');
  if(/\b(?:boek nu|vraag je scan aan|meld je aan|koop nu|download nu|plan een afspraak|gratis scan|dm me|ontdek onze diensten)\b/iu.test(text))
    fail('PERSONAL_EDITORIAL_PROMOTION','Geen directe commerciële oproep in de persoonlijke ondernemersreis.');
  // Quantified public claims need an EXACT, independently checked factual source,
  // not an unrelated health metric or source_backed=true metadata.
  const numericalClaims=[
    ...(text.match(/\b\d+(?:[.,]\d+)?\s*(?:%|procent|op de (?:tien|honderd)|bedrijven|organisaties|werknemers|lagen|systemen|modellen)\b/giu)||[]),
    ...(text.match(/\b(?:een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien)\s+op\s+(?:de\s+)?(?:tien|honderd)\b/giu)||[])
  ];
  const sourced=Array.isArray(evidence?.verified_numeric_claims)?evidence.verified_numeric_claims:[];
  for(const claim of numericalClaims) {
    const verified=sourced.some((item)=>item?.verified===true&&item?.claim===claim&&
      /^https:\/\/\S+/i.test(String(item?.source_url||''))&&!!item?.checked_at);
    if(!verified){fail('PERSONAL_EDITORIAL_UNSOURCED_STATISTIC','Publieke cijferclaim zonder exacte externe broncontrole: '+claim);break;}
  }
  if(!observation) {
    if(!/\b(?:ik|mijn|mij|me)\b/iu.test(text.slice(0,260)))
      fail('PERSONAL_EDITORIAL_AUTHENTIC_VOICE','Begin vanuit een eigen overtuiging, echt moment of geverifieerde oprichtersfrictie.');
  }
  if(builder&&!/\b(?:ondernemers?|bedrijven|organisaties?|strategie|keuzes?|risico|klanten?|mensen)\b/iu.test(text))
    fail('PERSONAL_EDITORIAL_ENTREPRENEUR_RELEVANCE','Een oprichtersverhaal moet een herkenbaar menselijk ondernemersprobleem raken.');
  // Compare ORIGINAL published personal posts, never a caller-supplied winner label.
  // This remains an editorial veto, not a new publication authorization.
  for(const code of personalNarrativePatternViolations(text,evidence?.recentPersonalPosts||[]))
    fail(code,'De nieuwe persoonlijke tekst gebruikt te veel dezelfde opening, afsluiting of verhaalsjabloon. Herschrijf alleen de vorm met dezelfde geverifieerde feiten.');
  if(/\b(?:reageer met|comment met|like als|tag iemand|zet ja in de reacties)\b/iu.test(text))
    fail('PERSONAL_EDITORIAL_ENGAGEMENT_BAIT','Geen opzettelijke reacties lokken of engagement-uitlokking.');
  return out;
}


/**
 * High-precision style-pattern veto; semantic incident/story-family dedupe remains
 * the authority for topics. False positives are more damaging than ambiguity:
 * we only block repeated distinctive sentence frames or multi-marker templates.
 * Inputs are actual published personal prose from the original database reader.
 */
export function personalNarrativePatternViolations(candidate,recentPosts=[]){
  const text=String(candidate??'').trim();
  if(!text)return [];
  const normalize=value=>String(value??'').toLowerCase().normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/gu,' ').trim();
  const lead=value=>normalize(value.split(/[.!?\n]/u).find(Boolean)||value).split(/\s+/u).slice(0,6).join(' ');
  const ending=value=>normalize(value.split(/\n+/u).filter(Boolean).at(-1)||value);
  const markers=value=>['ik dacht dat ik gewoon','totdat ik','blijkt dat','en het mooiste','herkenbaar','ben ik de enige','ik wilde gewoon','klinkt eenvoudig'].filter(p=>normalize(value).includes(p));
  const currentLead=lead(text), currentEnding=ending(text), currentMarkers=markers(text);
  for(const p of Array.isArray(recentPosts)?recentPosts:[]){
    const previous=typeof p==='string'?p:String(p?.body||'');
    if(!previous.trim())continue;
    const prevLead=lead(previous),prevEnding=ending(previous);
    if(currentLead.split(' ').length>=6&&currentLead===prevLead)
      return ['PERSONAL_EDITORIAL_REPEATED_OPENING'];
    if(currentEnding.split(' ').length>=6&&currentEnding===prevEnding)
      return ['PERSONAL_EDITORIAL_REPEATED_ENDING'];
    const overlap=currentMarkers.filter(marker=>markers(previous).includes(marker));
    if(overlap.length>=2&&/\?\s*$/u.test(text)&&/\?\s*$/u.test(previous))
      return ['PERSONAL_EDITORIAL_REPEATED_STORY_TEMPLATE'];
  }
  return [];
}
