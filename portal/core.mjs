export const NAV_ITEMS = Object.freeze([
  { id:'today', label:'Vandaag', icon:'home' },
  { id:'company', label:'Bedrijf', icon:'company' },
  { id:'intelligence', label:'Intelligence', icon:'radar' },
  { id:'decisions', label:'Besluiten', icon:'decision' },
  { id:'execution', label:'Uitvoering', icon:'execute' },
  { id:'impact', label:'Impact', icon:'impact' },
  { id:'memory', label:'Geheugen', icon:'memory' },
  { id:'admin', label:'Beheer', icon:'settings' },
]);
export const PRIMARY_ROUTES = Object.freeze(['today','company/health','company','intelligence','decisions','execution','impact','memory','admin']);
export const LEGACY_CAPABILITIES = Object.freeze([
{id:'overzicht',label:'Overzicht',canonicalRoute:'today',requiredSurface:'executive-overview'},
{id:'bedrijfsgezondheid',label:'Bedrijfsgezondheid',canonicalRoute:'company/health',requiredSurface:'health'},
{id:'strategie-uitvoering',label:'Strategie & uitvoering',canonicalRoute:'company/strategy',requiredSurface:'strategy-roadmap'},
{id:'processen-organisatie',label:'Processen & organisatie',canonicalRoute:'company/processes',requiredSurface:'process-organisation'},
{id:'kennis',label:'Kennis',canonicalRoute:'memory/knowledge',requiredSurface:'knowledge'},
{id:'data-koppelingen',label:'Data & koppelingen',canonicalRoute:'company/data',requiredSurface:'data-integrations'},
{id:'ai-insights',label:'AI & Insights',canonicalRoute:'intelligence',requiredSurface:'ai-intelligence'},
{id:'acties-impact',label:'Acties & impact',canonicalRoute:'execution',requiredSurface:'actions-impact'},
{id:'rapportages',label:'Rapportages',canonicalRoute:'impact/reports',requiredSurface:'reports'},
{id:'koppelingen-bouwen',label:'Koppelingen bouwen',canonicalRoute:'admin/integrations',requiredSurface:'integration-builder'},
{id:'roadmap',label:'Roadmap',canonicalRoute:'execution/roadmap',requiredSurface:'roadmap'},
{id:'facturen-abonnement',label:'Facturen & abonnement',canonicalRoute:'admin/billing',requiredSurface:'billing'},
{id:'organisatie-gebruikers',label:'Organisatie & gebruikers',canonicalRoute:'admin/users',requiredSurface:'users'},
{id:'instellingen',label:'Instellingen',canonicalRoute:'admin/settings',requiredSurface:'settings'},
{id:'frisse-blik',label:'Frisse Blik Scan',canonicalRoute:'admin/frisse-blik',requiredSurface:'upsell'}
]);
export const SIGNAL_PIPELINE = Object.freeze(['signal','verify','match','impact','prioritise','recommend']);
export const PORTAL_INDEX = Object.freeze(LEGACY_CAPABILITIES.map(x=>({type:'Navigatie',title:x.label,route:x.canonicalRoute,keywords:`${x.id} ${x.requiredSurface}`})));
export function canCompleteAction(action){return Boolean(action?.owner&&action.executed&&action.verified&&action.result)}
export function riskPolicy(score){const n=Number(score);if(!Number.isFinite(n)||n<0||n>100)throw new RangeError('risk score must be 0-100');if(n<=20)return'autonomous';if(n<=50)return'autonomous-audit';if(n<=80)return'approval';return'human-controlled'}
export function verifiedValue(items=[]){return items.filter(i=>i?.stage==='Realised'&&i?.verified===true&&i?.evidence).reduce((sum,i)=>sum+Number(i.amount||0),0)}
export function routeFromHash(hash){const raw=(hash||'').replace(/^#\/?/,'').replace(/^\/+/, '');if(!raw)return'today';const top=raw.split('/')[0];return NAV_ITEMS.some(x=>x.id===top)?top:'today'}
export function parsePortalLocation(hash){const raw=(hash||'').replace(/^#\/?/,'').replace(/^\/+/, '');return raw||'today'}
export function buildPortalIndex(state={}){const rows=[...PORTAL_INDEX];const add=(items,type,route,title='title',keywords=[])=>{for(const item of Array.isArray(items)?items:[]){const label=item?.[title]||item?.label||item?.name;if(!label)continue;rows.push({type,title:String(label),route,keywords:keywords.map(k=>item?.[k]).filter(Boolean).flat().join(' ')})}};add(state.actions,'Actie','execution','title',['owner','status','source']);add(state.decisions,'Besluit','decisions','title',['why','expected','owner','risk']);add(state.signals,'Signaal','intelligence','title',['category','source','summary','affected']);add(state.memories,'Kennis','memory/knowledge','title',['excerpt','type','date']);add(state.graph?.nodes,'Bedrijfsobject','company','label',['meta','type']);add(state.healthCards,'KPI','company/health','label',['value']);return rows}
export function searchPortal(query,state={}){const q=(query||'').trim().toLowerCase();if(!q)return[];return buildPortalIndex(state).filter(x=>`${x.title} ${x.type} ${x.keywords}`.toLowerCase().includes(q)).slice(0,30)}
