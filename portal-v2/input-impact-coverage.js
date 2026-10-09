import { PORTAL_PAGE_INDEX } from './page-registry.js';
import { STRATEGIC_MODEL_IDS } from './strategic-models-core.js';

// A field-to-consequence contract. Names describe review/recalculation obligations,
// not proof that an external calculator, legal review or customer action was completed.
const AREAS=Object.freeze([
  {id:'profile',pattern:/^portal\.profile(?:\.|$)/,label:'Bedrijfsprofiel en volwassenheid',pages:['profiel','overzicht','businesscase','strategie-naar-maandagochtend','advies','roadmap'],models:['maturity','capacity','cost-to-change']},
  {id:'finance',pattern:/^portal\.(?:metrics|valueFinance|businessCase)(?:\.|$)/,label:'Financiën en bedrijfsprestaties',pages:['cijfers-maatstaven','waarde-financiering','businesscase','due-diligence','advies','roadmap'],models:['finance','valuation','cash-flow','businesscase']},
  {id:'people',pattern:/^portal\.people(?:\.|$)/,label:'Medewerkers, MTO en kennisrisico',pages:['mensen','overzicht','businesscase','due-diligence','advies','roadmap'],models:['people','capacity','risk']},
  {id:'data-ai',pattern:/^portal\.(?:dataAi|aiScan|aiCapabilities|aiCapabilitySources)(?:\.|$)/,label:'Data en AI',pages:['data-ai','ai-scan','ai-capabilities','compliance-governance','businesscase','advies','roadmap'],models:['ai-readiness','governance','risk','businesscase']},
  {id:'governance',pattern:/^portal\.(?:compliance|aiAct)(?:\.|$)/,label:'Governance, compliance en CSRD',pages:['compliance-governance','eu-ai-act-audit','csrd-impact','due-diligence','advies','roadmap'],models:['regulatory-applicability','governance','csrd-evidence','risk']},
  {id:'market',pattern:/^portal\.(?:market|research)(?:\.|$)/,label:'Markt, benchmark en onderzoek',pages:['branche-markt','onderzoek','profiel','businesscase','advies','roadmap'],models:['benchmark','source-quality','strategy']},
  {id:'strategy',pattern:/^portal\.(?:strategy|strategicModels|canvases|finalConclusion|business_context)(?:\.|$)/,label:'Strategie en bedrijfscontext',pages:['bedrijfssituatie','strategiemodellen','canvassen','strategie-naar-maandagochtend','advies','roadmap'],models:['strategy','scenario','prioritization']},
  {id:'risk',pattern:/^portal\.dueDiligence(?:\.|$)/,label:'Due diligence en risicobeheersing',pages:['due-diligence','exit','waarde-financiering','advies','roadmap'],models:['due-diligence','risk','valuation']},
  {id:'execution',pattern:/^portal\.(?:changes|tasks|roadmap|advice|freshness|offer)(?:\.|$)/,label:'Wijzigingen, planning, taken en waarde',pages:['wijzigingen','taken-werkstromen','actieve-acties','roadmap','advies','outcomes-evidence'],models:['delivery','dependencies','realized-value']},
  {id:'external',pattern:/^portal\.(?:external|regulatory|sources)(?:\.|$)/,label:'Buitenwereld, markt en wetgeving',pages:['omgevingsradar','wet-regelgeving','compliance-governance','csrd-impact','waarde-financiering','advies','roadmap'],models:['source-applicability','regulation','benchmark','risk']},
  {id:'page',pattern:/^portal\.pages\.[^.]+(?:\.|$)/,label:'Native portaalmodel',pages:['overzicht','advies','roadmap'],models:['page-specific-review']}
]);
export const PORTAL_INPUT_IMPACT_AREAS=AREAS;
const valid=pages=>[...new Set(pages)].filter(page=>Boolean(PORTAL_PAGE_INDEX[page]));
export function classifyPortalInputPath(path=''){
 const value=String(path);
 const rule=AREAS.find(x=>x.pattern.test(value));
 if(!rule)return Object.freeze({path:value,category:'unclassified',label:'Nog niet geclassificeerd',affectedPages:[],modelFamilies:[],evidenceStatus:'REVIEW_REQUIRED',mappingStatus:'REVIEW_REQUIRED'});
 return Object.freeze({path:value,category:rule.id,label:rule.label,affectedPages:Object.freeze(valid(rule.pages)),modelFamilies:Object.freeze([...rule.models]),evidenceStatus:'DEPENDENCY_REVIEW_REQUIRED',mappingStatus:'MAPPED'});
}

// Non-form-schema editors discovered in repository review. A native form schema
// does not cover these. Standalone or provider-side interfaces require separate
// auth/readback inspection before being marked as centrally wired.
export const SUPPLEMENTAL_PORTAL_INPUT_SURFACES=Object.freeze([
 Object.freeze({page:'bedrijfssituatie',module:'modules/business-context-workspace.js',paths:['portal.business_context.stage','portal.business_context.events','portal.business_context.goals','portal.business_context.target_stage','portal.business_context.goal_targets','portal.business_context.goal_scenarios'],writeContract:'DOMAIN_STATE_SET_PATCH',readback:'AUTHENTICATED_FLUSH_REQUIRED'}),
 Object.freeze({page:'wijzigingen',module:'modules/change-wizard.js',paths:['portal.changes.items'],writeContract:'DOMAIN_STATE_SET',readback:'AUTHENTICATED_FLUSH_REQUIRED'}),
 Object.freeze({page:'ai-capabilities',module:'modules/ai-capability-workspace.js',paths:['portal.aiCapabilities','portal.aiCapabilitySources'],writeContract:'DOMAIN_STATE_SET',readback:'AUTHENTICATED_FLUSH_REQUIRED'}),
 Object.freeze({page:'strategiemodellen',module:'modules/strategic-model-workspace.js',paths:STRATEGIC_MODEL_IDS.map(id=>`portal.strategicModels.${id}.note`),writeContract:'DYNAMIC_NOTE_PATH',readback:'MODEL_PATH_AUDIT_REQUIRED'}),
 Object.freeze({page:'koppelingen',module:'../portal-next/connector-builder-view.js',paths:[],writeContract:'SEPARATE_CONNECTOR_AUTHORITY',readback:'CONNECTOR_PROVIDER_READBACK_REQUIRED'}),
 Object.freeze({page:'compliance-command-center',module:'../portal-next/compliance-input-adapter.js',paths:[],writeContract:'LEGACY_COMPLIANCE_ADAPTER',readback:'TENANT_APPLICABILITY_READBACK_REQUIRED'})
]);
