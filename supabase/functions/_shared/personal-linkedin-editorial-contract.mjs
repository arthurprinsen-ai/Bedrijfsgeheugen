// Canonical Notion: "Skill — Persoonlijk LinkedIn: persoonlijke ondernemersreis & leven"
// and "Persoonlijk profiel — wat er wel en niet op mag" (read 2026-10-10).
// This is a deterministic delivery veto, NOT a substitute for source verification.
export const PERSONAL_EDITORIAL_POLICY = 'personal-linkedin-founder-editorial-v3';

export function personalEditorialViolations(value, evidence={}) {
  const text=String(value??'').trim();
  const out=[];
  const fail=(code,reason)=>out.push({code,message:reason});
  const words=text ? text.split(/\s+/u).filter(Boolean).length : 0;
  const builder=evidence?.ai_native_builder_story_verified===true;
  const observation=evidence?.observational_personal_theme_verified===true&&!builder;
  if(words<130||words>200)
    fail('PERSONAL_EDITORIAL_WORD_COUNT','Persoonlijke LinkedIn-tekst: 130–200 woorden, geen intern rapport. Aangetroffen: '+words);
  if(/(?:\*\*|__|(^|\n)\s*#{1,6}\s|(^|\n)\s*(?:-{3,}|\*{3,}|_{3,})\s*(?=\n|$)|(^|\n)\s*[-•]\s|\x60{3,}|\*(?=\S))/u.test(text))
    fail('PERSONAL_EDITORIAL_MARKDOWN','Verwijder zichtbare Markdown- en documentopmaak. LinkedIn-tekst is platte tekst.');
  if(/https?:\/\/|www\./i.test(text))
    fail('PERSONAL_EDITORIAL_URL','Een persoonlijk oprichtersverhaal bevat geen directe link in de post.');
  if((text.match(/#[\p{L}\p{N}_]+/gu)||[]).length>3)
    fail('PERSONAL_EDITORIAL_HASHTAG_COUNT','Gebruik maximaal drie hashtags.');
  if(/\p{Extended_Pictographic}/u.test(text))
    fail('PERSONAL_EDITORIAL_EMOJI','Geen emoji in persoonlijke profieltekst.');
  if(/\b(?:pipeline|runtime|heartbeat|readback|provider[- ]?(?:receipt|id|bewijs)|debug|supabase|github|netlify|postgres|sql|api[- ]?request|statuscode|bewakingscycli|systeemstatus|technische status|groen(?:e)? (?:status|bewaking)|bronbewijs|feedbacklus|intelligentiela(?:ag|gen)[a-z]*)\b/iu.test(text))
    fail('PERSONAL_EDITORIAL_TECHNICAL_STATUS','Vertaal interne technische status naar één concreet menselijk gevolg.');
  if(/\b(?:blog (?:stond|staat) live|e-?mail (?:werd|is) (?:verstuurd|verzonden)|informatie ging uit|verzonden,? bewezen|acties zijn uitgegaan)\b/iu.test(text))
    fail('PERSONAL_EDITORIAL_DELIVERY_REPORT','Interne verzending en publicatiestatus zijn geen persoonlijk verhaal.');
  if(/\b(?:boek nu|vraag je scan aan|meld je aan|koop nu|download nu|plan een afspraak|gratis scan|dm me)\b/iu.test(text))
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
    if(!/\?\s*$/u.test(text))
      fail('PERSONAL_EDITORIAL_OPEN_QUESTION','Sluit af met een oprechte open vraag voor een persoonlijk gesprek.');
  }
  if(builder&&!/\b(?:ondernemers?|bedrijven|organisaties?|strategie|keuzes?|risico|klanten?|mensen)\b/iu.test(text))
    fail('PERSONAL_EDITORIAL_ENTREPRENEUR_RELEVANCE','Een oprichtersverhaal moet een herkenbaar menselijk ondernemersprobleem raken.');
  return out;
}
