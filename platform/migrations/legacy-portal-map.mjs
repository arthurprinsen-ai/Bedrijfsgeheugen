export const LEGACY_PORTAL_MAP = Object.freeze({
  overzicht:{ target:'Overzicht', objects:['Company','Finding','Recommendation','RoadmapItem'], classification:'IMPROVE' },
  profiel:{ target:'BusinessHealth', objects:['Company','BusinessUnit','Capability'], classification:'IMPROVE' },
  dataai:{ target:'Data & Technologie', objects:['System','DataDomain','Dataset','AIUseCase','Capability'], classification:'IMPROVE' },
  aiscan:{ target:'Data & Technologie / AI', objects:['AIUseCase','Opportunity','Finding'], classification:'KEEP/IMPROVE' },
  invoeren:{ target:'Contextual Editors', objects:['Company','BusinessUnit','Process','System','DataDomain'], classification:'IMPROVE' },
  antwoorden:{ target:'Frisse Blik / Evidence', objects:['Response','Evidence'], classification:'KEEP' },
  business:{ target:'Groei / Finance / Impact', objects:['Assumption','Revenue','Impact'], classification:'IMPROVE' },
  cijfers:{ target:'KPI / Metric', objects:['KPI','Dataset'], classification:'IMPROVE' },
  waarde:{ target:'Finance / Impact', objects:['Impact','Revenue','Assumption'], classification:'IMPROVE' },
  mensen:{ target:'Organisatie', objects:['Team','Role','Person','Capability'], classification:'IMPROVE' },
  branche:{ target:'Groei / External Intelligence', objects:['Market','Segment','Opportunity'], classification:'IMPROVE' },
  onderzoek:{ target:'Evidence / External Intelligence', objects:['Evidence','Finding'], classification:'KEEP/IMPROVE' },
  beleid:{ target:'Trust & Governance', objects:['Policy','Requirement','Control','Evidence'], classification:'IMPROVE' },
  aicap:{ target:'Data & Technologie / AI', objects:['Capability','AIUseCase'], classification:'KEEP/IMPROVE' },
  strategie:{ target:'Strategie', objects:['Strategy','Goal','KPI','Assumption','Constraint','Decision'], classification:'KEEP/IMPROVE' },
  canvassen:{ target:'Model Library', objects:['BusinessModel','ModelVersion','FieldDefinition','Response'], classification:'KEEP/IMPROVE' },
  eindconclusie:{ target:'Overzicht / Management Summary', objects:['Finding','Recommendation','Decision'], classification:'IMPROVE' },
  dd:{ target:'Trust / Growth / Reports', objects:['Risk','Evidence','Contract','Vendor'], classification:'KEEP/IMPROVE' },
  dna:{ target:'Strategie + Uitvoering', objects:['Strategy','Goal','Initiative','RoadmapItem'], classification:'IMPROVE' },
  bijhouden:{ target:'Platform freshness', objects:['Evidence','Integration','Document','Dataset'], classification:'IMPROVE' },
  wijzigingen:{ target:'Change Center', objects:['Change','Impact','Evidence'], classification:'IMPROVE' },
  advies:{ target:'Contextual Recommendations', objects:['Recommendation','Action'], classification:'IMPROVE' },
  offerte:{ target:'Groei / Beheer', objects:['Offering','PricePlan','Contract'], classification:'KEEP' },
  roadmap:{ target:'Uitvoering / Roadmap', objects:['Initiative','Project','RoadmapItem','Action'], classification:'IMPROVE' },
});

export const MIGRATION_STATES = Object.freeze(['BASELINE_CAPTURED','MAPPED','DUAL_RUN','RECONCILED','PARITY_VERIFIED','RETIREMENT_APPROVED','RETIRED']);

export function assertMigrationTransition(from, to) {
  const fromIndex = MIGRATION_STATES.indexOf(from);
  const toIndex = MIGRATION_STATES.indexOf(to);
  if (fromIndex < 0 || toIndex < 0 || toIndex !== fromIndex + 1) throw new Error(`invalid migration transition ${from} -> ${to}`);
  return true;
}
