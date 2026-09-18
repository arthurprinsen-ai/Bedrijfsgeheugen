const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const uniq=values=>[...new Set((values||[]).filter(Boolean).map(String))];
const clean=value=>String(value??'').trim();
export const ORGANISM_GRAPH_VERSION='powerhouse-organism-v1';
export const ORGANISM_RELATIONS=freeze([
 {from:'portal.state',to:'regulatory.scope',weight:1,reason:'Organisatieprofiel en activiteiten bepalen wettelijke toepasselijkheid.'},
 {from:'portal.state',to:'data.inventory',weight:1,reason:'Elke portaalwijziging kan de feitelijke datakaart veranderen.'},
 {from:'regulatory.scope',to:'compliance.eu_ai_act',weight:1,reason:'Scope bepaalt welke AI Act-verplichtingen gelden.'},
 {from:'regulatory.scope',to:'compliance.nis2_cbw',weight:1,reason:'Sector, omvang en diensten bepalen NIS2/Cbw-toepasselijkheid.'},
 {from:'regulatory.scope',to:'compliance.gdpr',weight:.95,reason:'Activiteiten en gegevensstromen bepalen privacyverplichtingen.'},
 {from:'ai.inventory',to:'ai.risk',weight:1,reason:'AI-use-cases moeten opnieuw worden geclassificeerd.'},
 {from:'ai.inventory',to:'data.inventory',weight:1,reason:'AI-gebruik introduceert of wijzigt gegevensstromen.'},
 {from:'ai.inventory',to:'suppliers',weight:.9,reason:'AI-providers zijn leveranciers of subprocessors.'},
 {from:'ai.risk',to:'compliance.eu_ai_act',weight:1,reason:'AI-risicoklasse en rol sturen AI Act-controls.'},
 {from:'data.inventory',to:'compliance.gdpr',weight:1,reason:'Datacategorie, doel en grondslag bepalen AVG-impact.'},
 {from:'data.inventory',to:'data.location',weight:.95,reason:'Nieuwe gegevensstromen vereisen locatiekennis.'},
 {from:'data.location',to:'suppliers',weight:.9,reason:'Dataresidentie hangt af van providers.'},
 {from:'suppliers',to:'security.supply_chain',weight:1,reason:'Leveranciers wijzigen ketenrisico.'},
 {from:'security.supply_chain',to:'compliance.nis2_cbw',weight:1,reason:'Ketenrisico valt onder NIS2/Cbw-risicobeheersing.'},
 {from:'security.risk',to:'compliance.nis2_cbw',weight:1,reason:'Cyberrisico bepaalt maatregelen en prioriteit.'},
 {from:'compliance.eu_ai_act',to:'risk.register',weight:1,reason:'Compliance-gaps worden bestuurbare risico’s.'},
 {from:'compliance.nis2_cbw',to:'risk.register',weight:1,reason:'NIS2/Cbw-gaps worden bestuurbare risico’s.'},
 {from:'compliance.gdpr',to:'risk.register',weight:.95,reason:'Privacy-gaps worden bestuurbare risico’s.'},
 {from:'risk.register',to:'actions',weight:1,reason:'Materiële risico’s genereren acties.'},
 {from:'risk.register',to:'finance',weight:.85,reason:'Risico’s hebben kosten en exposure.'},
 {from:'actions',to:'capacity',weight:1,reason:'Acties verbruiken capaciteit en doorlooptijd.'},
 {from:'actions',to:'finance',weight:.9,reason:'Acties hebben kosten en baten.'},
 {from:'capacity',to:'finance',weight:.8,reason:'Uren en FTE wijzigen planning en businesscase.'},
 {from:'finance',to:'executive.cockpit',weight:1,reason:'Financiële impact hoort in executive prioritering.'},
 {from:'risk.register',to:'executive.cockpit',weight:1,reason:'Toprisico’s horen in de executive cockpit.'},
 {from:'actions',to:'executive.cockpit',weight:.95,reason:'Prioritaire acties horen in de executive cockpit.'},
 {from:'executive.cockpit',to:'advice',weight:1,reason:'Advies gebruikt actuele feiten, risico’s, geld en capaciteit.'},
 {from:'advice',to:'powerhouse.brain',weight:1,reason:'Adviezen en uitkomsten worden teruggeschreven naar Brain.'},
 {from:'compliance.eu_ai_act',to:'audit.evidence',weight:1,reason:'Complianceconclusies moeten evidence-backed zijn.'},
 {from:'compliance.nis2_cbw',to:'audit.evidence',weight:1,reason:'Complianceconclusies moeten evidence-backed zijn.'},
 {from:'compliance.gdpr',to:'audit.evidence',weight:1,reason:'Complianceconclusies moeten evidence-backed zijn.'}
]);
const INPUT_START_NODES=freeze({
 CompanyProfile:['portal.state','regulatory.scope'],AIAssessment:['portal.state','ai.inventory'],
 AIActAssessment:['portal.state','ai.inventory','compliance.eu_ai_act'],
 ComplianceAssessment:['portal.state','regulatory.scope','security.risk','compliance.nis2_cbw','compliance.gdpr'],
 BusinessMetrics:['portal.state','finance'],FinancialAssessment:['portal.state','finance'],PeopleAssessment:['portal.state','capacity'],
 MarketAssessment:['portal.state','regulatory.scope'],DueDiligenceAssessment:['portal.state','risk.register','suppliers'],
 PortalDomainStateSnapshot:['portal.state'],StrategyModel:['portal.state','actions'],StrategyExecution:['portal.state','actions'],StrategyCanvas:['portal.state','actions']
});
const PATH_RULES=freeze([
 [/ai|model|copilot|agent|prompt/i,['ai.inventory']],
 [/compliance|nis2|nis|cyber|security|incident|continu|backup|mfa|toegang/i,['regulatory.scope','security.risk','compliance.nis2_cbw']],
 [/privacy|avg|gdpr|persoon|data|verwerk|bewaar|grondslag/i,['data.inventory','compliance.gdpr']],
 [/leverancier|provider|vendor|processor|subprocessor|koppeling|connector/i,['suppliers']],
 [/geld|omzet|kosten|marge|finance|cijfers|waarde|businesscase/i,['finance']],
 [/uur|fte|capaciteit|mensen|people|medewerker/i,['capacity']],
 [/actie|roadmap|strategie|canvas|project|taak/i,['actions']]
]);
export function sourceNodesForInput({inputType='',modelId='',statePath=''}={}){
 const nodes=[...(INPUT_START_NODES[clean(inputType)]||[])],haystack=clean(modelId)+' '+clean(statePath);
 for(const [pattern,extra] of PATH_RULES)if(pattern.test(haystack))nodes.push(...extra);
 if(nodes.length===0)nodes.push('portal.state');
 return Object.freeze(uniq(nodes));
}
export function deriveOrganismEffects(input={}, {maxDepth=8,hopDecay=.94}={}){
 const starts=sourceNodesForInput(input),outgoing=new Map(),best=new Map(),queue=[];
 for(const relation of ORGANISM_RELATIONS){if(!outgoing.has(relation.from))outgoing.set(relation.from,[]);outgoing.get(relation.from).push(relation);}
 for(const node of starts){const item={domain:node,depth:0,impactScore:1,path:[node],reasons:[]};best.set(node,item);queue.push({node,depth:0,score:1,path:[node],reasons:[]});}
 while(queue.length){const current=queue.shift();if(current.depth>=maxDepth)continue;for(const edge of outgoing.get(current.node)||[]){if(current.path.includes(edge.to))continue;const depth=current.depth+1,score=current.score*Number(edge.weight||1)*(depth>1?hopDecay:1);const candidate={domain:edge.to,depth,impactScore:Number(score.toFixed(6)),path:[...current.path,edge.to],reasons:[...current.reasons,edge.reason]},existing=best.get(edge.to);if(!existing||candidate.impactScore>existing.impactScore){best.set(edge.to,candidate);queue.push({node:edge.to,depth,score:candidate.impactScore,path:candidate.path,reasons:candidate.reasons});}}}
 const impacts=[...best.values()].sort((a,b)=>a.depth-b.depth||b.impactScore-a.impactScore||a.domain.localeCompare(b.domain));
 return freeze({version:ORGANISM_GRAPH_VERSION,startNodes:starts,impacts,recomputeDomains:impacts.map(item=>item.domain)});
}
export const ORGANISM_PAGE_MAP=freeze({
 'regulatory.scope':['profiel','compliance-governance'],'ai.inventory':['data-ai','ai-scan','ai-capabilities','compliance-governance'],
 'ai.risk':['ai-capabilities','compliance-governance'],'data.inventory':['data-ai','compliance-governance','due-diligence'],
 'data.location':['compliance-governance','due-diligence'],suppliers:['koppelingen','compliance-governance','due-diligence'],
 'security.risk':['compliance-governance','due-diligence'],'security.supply_chain':['compliance-governance','due-diligence'],
 'compliance.eu_ai_act':['compliance-governance'],'compliance.nis2_cbw':['compliance-governance'],'compliance.gdpr':['compliance-governance'],
 'risk.register':['overzicht','advies','roadmap','due-diligence'],actions:['overzicht','advies','roadmap','taken-werkstromen'],
 capacity:['overzicht','roadmap','taken-werkstromen','mensen'],finance:['overzicht','businesscase','cijfers-maatstaven','waarde-financiering','roadmap'],
 'executive.cockpit':['overzicht'],advice:['overzicht','advies'],'audit.evidence':['compliance-governance','due-diligence'],
 'powerhouse.brain':['overzicht','wijzigingen','actueel-houden']
});
export function affectedPortalPages(effects){return Object.freeze(uniq((effects?.impacts||[]).flatMap(item=>ORGANISM_PAGE_MAP[item.domain]||[])));}
