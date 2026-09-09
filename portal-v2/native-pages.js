import { pageMetrics, pageWorklist, hasPageData, emptyStateCopy } from './page-metrics.js';

/**
 * Navigatie per pagina: de primaire actie en de drie vervolgstappen.
 * Dit zijn routelabels, geen klantgegevens — daarom staan ze hier vast.
 * Alle getallen komen uit page-metrics.js en dus uit de klantstate.
 */
export const PAGE_NAVIGATION = Object.freeze({
  overzicht:["Open prioriteiten",[["Bekijk management summary","brain-verwerking"],["Open roadmap","roadmap"],["Bekijk impact","csrd-impact"]]],
  profiel:["Werk profiel bij",[["Vul ontbrekende gegevens aan","gegevens-invullen"],["Open eindconclusie","eindconclusie"],["Bekijk wijzigingen","wijzigingen"]]],
  "data-ai":["Prioriteer datakans",[["Open koppelingen","koppelingen"],["Bekijk AI-scan","ai-scan"],["Open bronnenstatus","bronnenstatus"]]],
  "ai-scan":["Start kansanalyse",[["Open kansenkaart","kansenkaart"],["Maak businesscase","businesscase"],["Zet actie uit","actieve-acties"]]],
  kansenkaart:["Kies volgende kans",[["Open AI-scan","ai-scan"],["Maak businesscase","businesscase"],["Plan in roadmap","roadmap"]]],
  "csrd-impact":["Open impactcockpit",[["Open audit","audit"],["Open compliance","compliance-governance"],["Bekijk acties","actieve-acties"]]],
  "gegevens-invullen":["Vul volgende sectie in",[["Bekijk ingevulde gegevens","ingevulde-gegevens"],["Open profiel","profiel"],["Bekijk risico-impact","eindconclusie"]]],
  "ingevulde-gegevens":["Controleer actualiteit",[["Werk gegevens bij","gegevens-invullen"],["Open wijzigingen","wijzigingen"],["Open audit","audit"]]],
  businesscase:["Maak scenario",[["Vergelijk scenario’s","waarde-financiering"],["Plan uitvoering","roadmap"],["Maak offerte","offerte"]]],
  "cijfers-maatstaven":["Bekijk afwijkingen",[["Open businesscase","businesscase"],["Bekijk branche","branche-markt"],["Zet actie uit","actieve-acties"]]],
  "waarde-financiering":["Open scenario’s",[["Open due diligence","due-diligence"],["Open exit","exit"],["Maak businesscase","businesscase"]]],
  mensen:["Pak kennisrisico aan",[["Open kennis","documenten"],["Maak taak","taken-werkstromen"],["Bekijk profiel","profiel"]]],
  "branche-markt":["Vergelijk benchmark",[["Open cijfers","cijfers-maatstaven"],["Bekijk kansen","kansenkaart"],["Open onderzoek","onderzoek"]]],
  onderzoek:["Leg bevinding vast",[["Open eindconclusie","eindconclusie"],["Voeg document toe","documenten"],["Maak actie","actieve-acties"]]],
  "compliance-governance":["Pak hoogste risico",[["Open command center","compliance-command-center"],["Open audit","audit"],["Maak actie","actieve-acties"]]],
  "compliance-command-center":["Open auditpakket",[["Open compliance","compliance-governance"],["Open audit","audit"],["Open acties","actieve-acties"]]],
  "ai-capabilities":["Beoordeel capability",[["Open Brain","brain-verwerking"],["Open agentstatus","agentstatus"],["Open AI-scan","ai-scan"]]],
  strategiemodellen:["Open strategiemodel",[["Open canvassen","canvassen"],["Open eindconclusie","eindconclusie"],["Vertaal naar uitvoering","strategie-naar-maandagochtend"]]],
  modellen:["Kies model",[["Open strategiemodellen","strategiemodellen"],["Open canvassen","canvassen"],["Open onderzoek","onderzoek"]]],
  canvassen:["Werk canvas bij",[["Open strategiemodellen","strategiemodellen"],["Open roadmap","roadmap"],["Vertaal naar uitvoering","strategie-naar-maandagochtend"]]],
  eindconclusie:["Bespreek conclusie",[["Open roadmap","roadmap"],["Open advies","advies"],["Bekijk management summary","brain-verwerking"]]],
  "due-diligence":["Open dossier",[["Open waarde","waarde-financiering"],["Open audit","audit"],["Open exit","exit"]]],
  exit:["Beoordeel exit-readiness",[["Open due diligence","due-diligence"],["Open waarde","waarde-financiering"],["Plan verbeteringen","roadmap"]]],
  "strategie-naar-maandagochtend":["Maak uitvoeringsactie",[["Open roadmap","roadmap"],["Open uitvoeringsladder","uitvoeringsladder"],["Maak taken","taken-werkstromen"]]],
  "actueel-houden":["Werk verouderde bron bij",[["Open wijzigingen","wijzigingen"],["Open documenten","documenten"],["Maak taak","taken-werkstromen"]]],
  wijzigingen:["Beoordeel wijziging",[["Open impact","actieve-acties"],["Open audittrail","audittrail"],["Werk profiel bij","profiel"]]],
  advies:["Zet advies om in actie",[["Maak roadmap-item","roadmap"],["Open businesscase","businesscase"],["Maak offerte","offerte"]]],
  offerte:["Werk voorstel uit",[["Open businesscase","businesscase"],["Open roadmap","roadmap"],["Open taken","taken-werkstromen"]]],
  roadmap:["Plan volgende mijlpaal",[["Open taken","taken-werkstromen"],["Open actieve acties","actieve-acties"],["Bekijk outcomes","outcomes-evidence"]]],
  uitvoeringsladder:["Verhoog borgingsniveau",[["Open roadmap","roadmap"],["Open taken","taken-werkstromen"],["Open outcomes","outcomes-evidence"]]],
  "taken-werkstromen":["Maak taak",[["Open actieve acties","actieve-acties"],["Open roadmap","roadmap"],["Bekijk wijzigingen","wijzigingen"]]],
  bronnenstatus:["Herstel bron",[["Open koppelingen","koppelingen"],["Open datahub","datahubstatus"],["Maak recovery","recovery-obligations"]]],
  datahubstatus:["Bekijk dataketen",[["Open bronnen","bronnenstatus"],["Open Brain","brain-verwerking"],["Open self-heal","self-heal"]]],
  "brain-verwerking":["Open besliscontext",[["Open outcomes","outcomes-evidence"],["Open learning","learning-writeback"],["Open agentstatus","agentstatus"]]],
  agentstatus:["Bekijk agent",[["Open acties","actieve-acties"],["Open recovery","recovery-obligations"],["Open audittrail","audittrail"]]],
  "actieve-acties":["Prioriteer actie",[["Open taken","taken-werkstromen"],["Open outcomes","outcomes-evidence"],["Open roadmap","roadmap"]]],
  "recovery-obligations":["Sluit recovery loop",[["Open self-heal","self-heal"],["Open audittrail","audittrail"],["Bekijk outcomes","outcomes-evidence"]]],
  "outcomes-evidence":["Verifieer outcome",[["Open learning","learning-writeback"],["Open audittrail","audittrail"],["Open roadmap","roadmap"]]],
  "learning-writeback":["Schrijf learning terug",[["Open outcomes","outcomes-evidence"],["Open audittrail","audittrail"],["Open self-heal","self-heal"]]],
  "self-heal":["Open herstelactie",[["Open recovery","recovery-obligations"],["Open agentstatus","agentstatus"],["Open audittrail","audittrail"]]],
  audittrail:["Filter audittrail",[["Open audit","audit"],["Open outcomes","outcomes-evidence"],["Open wijzigingen","wijzigingen"]]],
  koppelingen:["Beheer koppeling",[["Open bronnenstatus","bronnenstatus"],["Open datahub","datahubstatus"],["Maak taak","taken-werkstromen"]]],
  gebruikers:["Beheer gebruiker",[["Open audit","audit"],["Open instellingen","instellingen"],["Bekijk wijzigingen","wijzigingen"]]],
  documenten:["Voeg document toe",[["Open actueel houden","actueel-houden"],["Open kennisprofiel","profiel"],["Open audit","audit"]]],
  instellingen:["Beheer instellingen",[["Open gebruikers","gebruikers"],["Open compliance","compliance-governance"],["Open audit","audit"]]],
  audit:["Exporteer auditoverzicht",[["Open compliance","compliance-governance"],["Open audittrail","audittrail"],["Open documenten","documenten"]]]

});

function currentState(state){
  if(state&&typeof state==='object')return state;
  try{return globalThis.__BG_PORTAL_DOMAIN_STATE__?.get?.()||{};}catch{return {};}
}

/**
 * Bouwt de blokken voor een pagina op basis van echte klantdata.
 * Zonder data komt er een expliciet leeg blok, nooit een voorbeeldgetal.
 */
export function nativePageContent(pageId,state){
  const navigation=PAGE_NAVIGATION[pageId];
  if(!navigation)return null;
  const [primaryAction,actions]=navigation;
  const model=currentState(state);
  const metrics=pageMetrics(pageId,model);
  const worklist=pageWorklist(pageId,model);
  const populated=hasPageData(pageId,model);
  const blocks=[];
  if(metrics.length)blocks.push({type:'metrics',title:'Stand van zaken',items:metrics,derived:populated});
  if(worklist.length)blocks.push({type:'worklist',title:'Wat vraagt aandacht',items:worklist,derived:true});
  else if(!populated)blocks.push({type:'empty',title:'Nog niets om te tonen',copy:emptyStateCopy(pageId)});
  blocks.push({type:'actions',title:'Volgende acties',items:actions});
  return {primaryAction,blocks,derived:populated};
}

export function listNativePages(){return Object.keys(PAGE_NAVIGATION);}
