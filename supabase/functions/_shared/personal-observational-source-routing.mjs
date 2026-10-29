// Existing canonical radar: split the SAME eight daily external-source calls
// between 6 entrepreneur/Mira sources and 2 actual personal-life source slots.
// No separate worker, scheduler, provider budget, writer, or publication route.
import {selectMiraSourceQueries} from './mira-source-query-rotation.mjs';

export const PERSONAL_OBSERVATIONAL_SOURCE_QUERIES=Object.freeze([
  Object.freeze({topic:'bezorging-en-pakketten',query:'Nederland pakket bezorging niet thuis app bezorgklacht ervaringen'}),
  Object.freeze({topic:'schoolapps-en-oudercommunicatie',query:'Nederland schoolapp oudercommunicatie berichten meldingen ervaringen'}),
  Object.freeze({topic:'parkeren-en-apps',query:'Nederland parkeren betaalapp parkeerapp frustratie ervaring'}),
  Object.freeze({topic:'wachtwoord-en-inloggen',query:'Nederland wachtwoord inloggen tweestapsverificatie digitale diensten klachten'}),
  Object.freeze({topic:'abonnementen-en-opzeggen',query:'Nederland abonnement opzeggen app ervaringen onduidelijke regels'}),
  Object.freeze({topic:'chatbots-en-klantenservice',query:'Nederland klantenservice chatbot mens spreken irritatie ervaringen'}),
  Object.freeze({topic:'meldingen-en-groepsapps',query:'Nederland groepsapp meldingen berichtjes teveel frustratie'}),
  Object.freeze({topic:'appstapeling-en-digitale-frictie',query:'Nederland meerdere apps digitale diensten dagelijks gedoe'})
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
