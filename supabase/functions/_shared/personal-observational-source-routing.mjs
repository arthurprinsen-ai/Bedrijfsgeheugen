// Existing canonical radar: split the SAME eight daily external-source calls
// between 6 entrepreneur/Mira sources and 2 actual personal-life source slots.
// No separate worker, scheduler, provider budget, writer, or publication route.
// Production HTTP 200 can still mean no eligible personal sources: 2026-10-29
// probe #16037 returned DataForSEO NEWS_NO_RESULTS for 7/8 long searches.
// Use short, high-recall Dutch-news terms; keep exact 6+2 / 8-call provider budget,
// the 45-day dated-source gate, 0.72 scoring and independent evidence unchanged.
import {selectMiraSourceQueries} from './mira-source-query-rotation.mjs';

export const PERSONAL_OBSERVATIONAL_SOURCE_QUERIES=Object.freeze([
  Object.freeze({topic:'bezorging-en-pakketten',query:'pakketbezorging bezorger'}),
  Object.freeze({topic:'schoolapps-en-oudercommunicatie',query:'schoolapp Magister'}),
  Object.freeze({topic:'parkeren-en-apps',query:'parkeerapp parkeren'}),
  Object.freeze({topic:'wachtwoord-en-inloggen',query:'inloggen wachtwoord'}),
  Object.freeze({topic:'abonnementen-en-opzeggen',query:'abonnement opzeggen'}),
  Object.freeze({topic:'chatbots-en-klantenservice',query:'chatbot klantenservice'}),
  Object.freeze({topic:'meldingen-en-groepsapps',query:'groepsapp meldingen'}),
  Object.freeze({topic:'appstapeling-en-digitale-frictie',query:'digitale diensten apps'})
]);
export const RADAR_TOTAL_EXTERNAL_QUERIES=8;
export const RADAR_PERSONAL_EXTERNAL_QUERIES=2;

export function selectCanonicalRadarSourceQueries(runDate){
  const business=selectMiraSourceQueries(runDate).slice(0,RADAR_TOTAL_EXTERNAL_QUERIES-RADAR_PERSONAL_EXTERNAL_QUERIES);
  const date=Date.parse(String(runDate)+'T00:00:00Z');
  if(!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==String(runDate))throw new Error('RADAR_RUN_DATE_INVALID');
  const first=(Math.floor(date/86400000)*3)%PERSONAL_OBSERVATIONAL_SOURCE_QUERIES.length;
  const personal=[0,1].map(i=>PERSONAL_OBSERVATIONAL_SOURCE_QUERIES[(first+i)%PERSONAL_OBSERVATIONAL_SOURCE_QUERIES.length]);
  return Object.freeze([
    ...business.map(query=>Object.freeze({channel:'instagram_company',query})),
    ...personal.map(({topic,query})=>Object.freeze({channel:'linkedin_personal',topic,query}))
  ]);
}

const PATTERNS=Object.freeze({
  'bezorging-en-pakketten':/pakket|bezorg|postnl|dhl|pakketpunt|afhaalpunt/i,
  'schoolapps-en-oudercommunicatie':/schoolapp|ouderportaal|schoolcommunicatie|oudercommunicatie|magister|social schools/i,
  'parkeren-en-apps':/parkeerapp|parkeren|parkeergeld|parkeerautomaat/i,
  'wachtwoord-en-inloggen':/wachtwoord|inlogg|inloggen|tweestapsverificatie|authenticatie|2fa/i,
  'abonnementen-en-opzeggen':/abonnement|opzeggen|opzegging|automatische verlenging/i,
  'chatbots-en-klantenservice':/chatbot|klantenservice|helpdesk|telefonische hulp|mens spreken/i,
  'meldingen-en-groepsapps':/groepsapp|groepschat|meldingen|whatsappgroep/i,
  'appstapeling-en-digitale-frictie':/meerdere apps|appstapeling|digitale diensten|in elke app|aparte app/i
});
export function classifyObservationalPersonalSource({topic,title,excerpt}={}){
  const family=String(topic||'');
  const text=String(title||'')+' '+String(excerpt||'');
  // Query-topic must also occur in independently returned provider text.
  if(!PATTERNS[family]?.test(text))return null;
  // Observations only: avoid business stories, fictional founder memories or private anecdotes.
  return family;
}
