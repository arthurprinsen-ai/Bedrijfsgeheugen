// Reuse the existing Mira radar's eight search slots; rotate approved PH-P topic families
// across business dates to avoid harvesting the same press release indefinitely.
// Topic families remain selected from the approved canonical portal problem catalog.
export const MIRA_SOURCE_TOPIC_QUERIES = Object.freeze([
  {topic:'offertes-zonder-opvolging',query:'mkb offertes opvolgen'},
  {topic:'directie-bottleneck',query:'mkb directeur besluit bottleneck'},
  {topic:'kennisoverdracht',query:'mkb kennisoverdracht personeel vertrek'},
  {topic:'excel-chaos',query:'mkb excel spreadsheets'},
  {topic:'dubbele-invoer',query:'mkb dubbele invoer CRM ERP'},
  {topic:'projectmarge',query:'mkb projectmarge meerwerk'},
  {topic:'groei-zonder-winst',query:'mkb groei omzet winst marge'},
  {topic:'capaciteitsplanning',query:'mkb personeelstekort planning'},
  {topic:'debiteuren',query:'mkb onbetaalde facturen debiteuren'},
  {topic:'late-facturering',query:'mkb facturering te laat'},
  {topic:'klantafhankelijkheid',query:'mkb klantafhankelijkheid'},
  {topic:'klantverlies',query:'mkb klantverlies churn'}
]);
const SEARCH_BUDGET=8;

export function selectMiraSourceQueries(runDate) {
  const date=String(runDate??'').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('MIRA_RUN_DATE_INVALID');
  const millis=Date.parse(date+'T00:00:00Z');
  if(!Number.isFinite(millis)||new Date(millis).toISOString().slice(0,10)!==date) throw new Error('MIRA_RUN_DATE_INVALID');
  const day=Math.floor(millis/86400000);
  const start=((day*5)%MIRA_SOURCE_TOPIC_QUERIES.length+MIRA_SOURCE_TOPIC_QUERIES.length)%MIRA_SOURCE_TOPIC_QUERIES.length;
  return Array.from({length:SEARCH_BUDGET},(_,i)=>MIRA_SOURCE_TOPIC_QUERIES[(start+i)%MIRA_SOURCE_TOPIC_QUERIES.length].query);
}
