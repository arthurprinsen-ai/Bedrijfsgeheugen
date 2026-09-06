export const PORTAL_SECTIONS = Object.freeze({
  overzicht: { label: 'Overzicht', pages: ['overzicht'] },
  inzicht: { label: 'Inzicht', pages: ['profiel','data-ai','ai-scan','kansenkaart','gegevens-invullen','ingevulde-gegevens','businesscase'] },
  vergelijken: { label: 'Vergelijken', pages: ['cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance'] },
  denken: { label: 'Denken', pages: ['strategiemodellen','modellen','canvassen','eindconclusie'] },
  overname: { label: 'Overname', pages: ['due-diligence','exit'] },
  doen: { label: 'Doen', pages: ['advies','offerte','roadmap','strategie-naar-maandagochtend','uitvoeringsladder','taken-werkstromen','actueel-houden','wijzigingen'] },
  'brein-powerhouse': { label: 'Brein & Powerhouse', pages: ['bronnenstatus','datahubstatus','brain-verwerking','agentstatus','actieve-acties','recovery-obligations','outcomes-evidence','learning-writeback','self-heal','audittrail'] },
  beheer: { label: 'Beheer', pages: ['koppelingen','gebruikers','documenten','instellingen','audit'] }
});

export const PORTAL_PAGE_INDEX = Object.freeze(Object.entries(PORTAL_SECTIONS).reduce((acc,[sectionId,section])=>{
  for (const id of section.pages) acc[id] = { id, sectionId, label: id };
  return acc;
},{}));

export const findPortalPage = id => PORTAL_PAGE_INDEX[id] ?? null;
export const assertPortalCoverage = existingIds => existingIds.filter(id => !findPortalPage(id));

export function buildStrategyTrace(buildingBlock = {}) {
  return { id: buildingBlock.id ?? null, order: ['strategie','thema','capability','afdeling','proces','systeem','data','ai','maatstaf','actie','outcome'] };
}

export function buildExecutionLadderTrace(step = {}) {
  return { id: step.id ?? null, order: ['tellen','vastleggen','koppelen','meten','borgen','actie','outcome'] };
}

export function buildChangeTrace(change = {}) {
  return { id: change.id ?? null, order: ['wijziging','geraakte-onderdelen','powerhouse-analyse','taak-actie','outcome','brain-update'] };
}
