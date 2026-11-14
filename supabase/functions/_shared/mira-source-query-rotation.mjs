// P0 #5232: 1-Nov source probe 18176 yielded 5 DataForSEO NEWS_NO_RESULTS from six\n// business queries. Shorten these six high-specificity Dutch news searches,\n// preserving their exact twelve canonical PH-P families, independent provider\n// publication date, originality checks and original 8-call fixed daily budget.\n// Reuse the existing Mira radar's eight search slots; rotate approved PH-P topic families
// across business dates to avoid harvesting the same press release indefinitely.
// Topic families remain selected from the approved canonical portal problem catalog.
export const MIRA_SOURCE_TOPIC_QUERIES = Object.freeze([
  {topic:'offertes-zonder-opvolging',query:'mkb offertes opvolgen'},
  {topic:'directie-bottleneck',query:'mkb directeur besluit bottleneck'},
  {topic:'kennisoverdracht',query:'mkb kennisoverdracht'},
  {topic:'excel-chaos',query:'mkb excel'},
  {topic:'dubbele-invoer',query:'mkb dubbele invoer'},
  {topic:'projectmarge',query:'mkb meerwerk'},
  {topic:'groei-zonder-winst',query:'mkb omzet marge'},
  {topic:'capaciteitsplanning',query:'mkb personeelstekort'},
  {topic:'debiteuren',query:'mkb onbetaalde facturen debiteuren'},
  {topic:'late-facturering',query:'mkb facturering te laat'},
  {topic:'klantafhankelijkheid',query:'mkb klantafhankelijkheid'},
  {topic:'klantverlies',query:'mkb klantverlies churn'}
]);

/* Original PH-P source families only; alternate wording is NOT source evidence. */
export const MIRA_SOURCE_ALTERNATE_QUERIES = Object.freeze({
 'offertes-zonder-opvolging':'ondernemers offertes opvolgen',
 'directie-bottleneck':'directeur besluit vertraging',
 'kennisoverdracht':'bedrijf kennisoverdracht',
 'excel-chaos':'bedrijven excel fouten',
 'dubbele-invoer':'bedrijf dubbele invoer',
 'projectmarge':'bouwproject meerwerk',
 'groei-zonder-winst':'ondernemers omzet marge',
 'capaciteitsplanning':'bedrijf personeelstekort planning',
 'debiteuren':'ondernemers onbetaalde facturen',
 'late-facturering':'bedrijf facturering te laat',
 'klantafhankelijkheid':'ondernemer afhankelijk grote klant',
 'klantverlies':'bedrijf klantverlies'
});
// Third bounded set of short, high-recall searches covers original approved
// PH-P topics without repeatedly returning the exact same earlier news links.
// This does not change the existing six Mira + two personal source requests.
export const MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES = Object.freeze({
 'offertes-zonder-opvolging':'offerte opvolging bedrijven',
 'directie-bottleneck':'directeur besluitvorming vertraging',
 'kennisoverdracht':'kennisverlies personeel bedrijven',
 'excel-chaos':'Excel fouten administraties',
 'dubbele-invoer':'dubbele invoer software',
 'projectmarge':'meerwerk bouwproject marge',
 'groei-zonder-winst':'groei omzet winst ondernemers',
 'capaciteitsplanning':'planning personeelstekort ondernemers',
 'debiteuren':'betaalachterstand debiteuren ondernemers',
 'late-facturering':'late facturering ondernemers',
 'klantafhankelijkheid':'grote klant afhankelijkheid',
 'klantverlies':'klantverlies bedrijven'
});
const SEARCH_BUDGET=8;

export function selectMiraSourceQueries(runDate) {
  const date=String(runDate??'').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('MIRA_RUN_DATE_INVALID');
  const millis=Date.parse(date+'T00:00:00Z');
  if(!Number.isFinite(millis)||new Date(millis).toISOString().slice(0,10)!==date) throw new Error('MIRA_RUN_DATE_INVALID');
  const day=Math.floor(millis/86400000);
  const start=((day*5)%MIRA_SOURCE_TOPIC_QUERIES.length+MIRA_SOURCE_TOPIC_QUERIES.length)%MIRA_SOURCE_TOPIC_QUERIES.length;
  // Keep eight slots, unchanged source/quality/dedupe guards and no extra calls.
  return Array.from({length:SEARCH_BUDGET},(_,i)=>{
    const family=MIRA_SOURCE_TOPIC_QUERIES[(start+i)%MIRA_SOURCE_TOPIC_QUERIES.length];
    // Change only QUERY wording in the existing eight-call budget. A query is
    // never evidence; provider result, publication date, independent link,
    // original daily source/topic dedupe and >=0.72 gate still decide eligibility.
    const rotation=(day%6+6)%6;
    return rotation<2?family.query:
      rotation<4?MIRA_SOURCE_ALTERNATE_QUERIES[family.topic]:
      MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES[family.topic];
  });
}
