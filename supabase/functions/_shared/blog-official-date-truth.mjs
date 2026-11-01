/**
 * Scoped factual-date guard; source of truth RVO 2026 CPNL.
 * Open 21 April 2026 09:00 until 6 October 2026 17:00 Amsterdam.
 * https://www.rvo.nl/subsidies-financiering/cpnl
 */
export function assessOfficialBlogDateTruth({title='',body='',cta='',runDate=''}={}){
 const date=typeof runDate==='string'?runDate:typeof runDate?.toISOString==='function'?runDate.toISOString().slice(0,10):String(runDate||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return {ok:false,code:'BLOG_RUN_DATE_INVALID'};
 const full=[title,body,cta].map(x=>String(x||'')).join('\n');
 if(!/circular[\s\W]*plastics[\s\W]*nl/i.test(full))return {ok:true,code:'NO_CPNL_SPECIFIC_CLAIM'};
 const afterClosed=date>='2026-10-07';
 // Explicitly support "opent de Circular Plastics NL-subsidie op 6 oktober".
 // Stop at "sluit", "gesloten", "21 april" or a clause end to avoid blocking
 // correctly written historical "opende 21 april en sloot 6 oktober".
 const claimedOpening=/(?:\bopent\b|\bopengaat\b|\bzal\s+openen\b)(?:(?!\b(?:sluit|gesloten|21\s+april)\b)[^\n.]){0,140}\b(?:op|vanaf|rond|per)?\s*6\s+oktober(?:\s+2026)?\b/i.test(full);
 const currentOpen=/\b(?:is|blijft)\s+(?:nu\s+)?open\s+voor\s+aanvragen\b/i.test(full);
 // P0 1 Nov production regression: "wordt voorspeld open te gaan rond 6
 // oktober 2026" escaped the narrow "opent op 6 oktober" pattern. The
 // official 2026 CPNL application period actually CLOSED on that date.
 // Treat only a future-claim near the ACTUAL CPNL closing date as unsafe;
 // do not block a truthful historical explanation or unrelated SOPV.
 const projectedOpenAtClose=/(?:\bwordt\s+(?:voorspeld|verwacht)\s+(?:open\s+te\s+gaan|te\s+openen)\b|\bvoorspelde\s+(?:aanvraag)?opening\b|\bverwachte\s+(?:aanvraag)?opening\b)(?:(?!\b(?:sloot|gesloten|eindigde)\b)[^.\n]){0,130}\b(?:op|vanaf|rond|per)?\s*6\s+oktober(?:\s+2026)?\b/i.test(full);
 const preApplicationTitle=/\bsubsidie[-\s]?klaar\b.{0,90}\b(?:vóór|voor)\s+de\s+circular\s+plastics\s+nl[-\s]aanvraag\b/i.test(String(title||''));
 // P0: the real second rejected original draft inverted the word order:
 // "Onze forecast verwacht dat de Circular Plastics NL-subsidie OP 6 OKTOBER
 // 2026 OPENGAAT". The date and future-tense opening must be evaluated as
 // ONE FACT, regardless of which comes first. Never match unrelated grants.
 // Split on sentence boundaries: another paragraph's truthful closing date
 // cannot absolve a standalone false future opening in a different sentence.
 const forecastOpeningInverted=full.split(/[.!?\n]+/).some(clause=>
  /circular[\s\W]*plastics[\s\W]*nl/i.test(clause)
  &&/\b6\s+oktober(?:\s+2026)?\b/i.test(clause)
  &&/\b(?:opengaat|open\s+te\s+gaan|opent|zal\s+openen|wordt\s+geopend|voorspeld|verwacht|forecast|komende\s+aanvraagopening)\b/i.test(clause)
  &&!/\b(?:sloot|gesloten|eindigde|liep\s+tot|verstreek|verlopen)\b/i.test(clause)
 );
 if(afterClosed&&(claimedOpening||currentOpen||projectedOpenAtClose||forecastOpeningInverted||preApplicationTitle)){
  return {ok:false,code:'BLOG_OFFICIAL_SUBSIDY_DEADLINE_INVERTED',
   authority:'RVO',source:'https://www.rvo.nl/subsidies-financiering/cpnl',
   actual_opened_on:'2026-04-21',actual_closed_on:'2026-10-06',
   published_approval_allowed:false,requires_corrected_source:true};
 }
 return {ok:true,code:'CPNL_CLAIM_NO_KNOWN_INVERSION',source:'https://www.rvo.nl/subsidies-financiering/cpnl'};
}
