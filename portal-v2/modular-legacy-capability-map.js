import { LEGACY_CAPABILITIES } from '../portal/core.mjs';

const entry=(legacyRoute,requiredSurface,v2Page)=>Object.freeze({legacyRoute,requiredSurface,v2Page});

export const MODULAR_LEGACY_CAPABILITY_MAP=Object.freeze({
  overzicht:entry('today','executive-overview','overzicht'),
  bedrijfsgezondheid:entry('company/health','health','profiel'),
  'strategie-uitvoering':entry('company/strategy','strategy-roadmap','strategie-naar-maandagochtend'),
  'processen-organisatie':entry('company/processes','process-organisation','profiel'),
  kennis:entry('memory/knowledge','knowledge','documenten'),
  'data-koppelingen':entry('company/data','data-integrations','koppelingen'),
  'ai-insights':entry('intelligence','ai-intelligence','brain-verwerking'),
  'acties-impact':entry('execution','actions-impact','actieve-acties'),
  rapportages:entry('impact/reports','reports','audit'),
  'koppelingen-bouwen':entry('admin/integrations','integration-builder','koppelingen'),
  roadmap:entry('execution/roadmap','roadmap','roadmap'),
  'facturen-abonnement':entry('admin/billing','billing','billing'),
  'organisatie-gebruikers':entry('admin/users','users','gebruikers'),
  instellingen:entry('admin/settings','settings','instellingen'),
  'frisse-blik':entry('admin/frisse-blik','upsell','frisse-blik')
});

export function modularLegacyParityGaps(){
  const gaps=[];
  const legacyById=new Map(LEGACY_CAPABILITIES.map(item=>[item.id,item]));
  for(const legacy of LEGACY_CAPABILITIES){
    const mapping=MODULAR_LEGACY_CAPABILITY_MAP[legacy.id];
    if(!mapping){gaps.push(`${legacy.id}:missing-mapping`);continue;}
    if(mapping.legacyRoute!==legacy.canonicalRoute)gaps.push(`${legacy.id}:legacy-route-drift`);
    if(mapping.requiredSurface!==legacy.requiredSurface)gaps.push(`${legacy.id}:required-surface-drift`);
    if(!mapping.v2Page)gaps.push(`${legacy.id}:missing-v2-page`);
  }
  for(const id of Object.keys(MODULAR_LEGACY_CAPABILITY_MAP))if(!legacyById.has(id))gaps.push(`${id}:unknown-legacy-capability`);
  return gaps;
}
