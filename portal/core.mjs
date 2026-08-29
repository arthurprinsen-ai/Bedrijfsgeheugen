export const NAV_ITEMS = [
  { id:'today', label:'Vandaag', icon:'spark' },
  { id:'company', label:'Bedrijf', icon:'company' },
  { id:'intelligence', label:'Intelligence', icon:'radar' },
  { id:'decisions', label:'Besluiten', icon:'decision' },
  { id:'execution', label:'Uitvoering', icon:'execute' },
  { id:'impact', label:'Impact', icon:'impact' },
  { id:'memory', label:'Geheugen', icon:'memory' },
  { id:'admin', label:'Beheer', icon:'settings' },
];
export const SIGNAL_PIPELINE = ['signal','verify','match','impact','prioritise','recommend'];
export const PORTAL_INDEX = [
  { type:'KPI', title:'Brutomarge Product B', route:'impact', keywords:'marge product b finance prijs' },
  { type:'Besluit', title:'Marge herstellen met prijswijziging', route:'decisions', keywords:'marge prijs besluit product b' },
  { type:'Kans', title:'€72K factuurcontrole', route:'intelligence', keywords:'besparing factuur finance opportunity' },
  { type:'Actie', title:'Prijs Product B voorbereiden', route:'execution', keywords:'prijs marge actie product b' },
  { type:'Learning', title:'Marge Product B', route:'memory', keywords:'marge learning prijs' },
  { type:'Agent', title:'Optimizer', route:'admin', keywords:'kosten performance agent optimizer' },
];
export function canCompleteAction(action){ return Boolean(action?.owner && action.executed && action.verified && action.result); }
export function riskPolicy(score){
  if(score < 0 || score > 100 || Number.isNaN(Number(score))) throw new RangeError('risk score must be 0-100');
  if(score <= 20) return 'autonomous';
  if(score <= 50) return 'autonomous-audit';
  if(score <= 80) return 'approval';
  return 'human-controlled';
}
export function verifiedValue(items){ return items.filter(i=>i.stage==='Realised' && i.verified).reduce((sum,i)=>sum+Number(i.amount||0),0); }
export function routeFromHash(hash){ const id=(hash||'').replace(/^#\/?/,'').split('/')[0]; return NAV_ITEMS.some(x=>x.id===id)?id:'today'; }
export function searchPortal(query){ const q=(query||'').trim().toLowerCase(); if(!q) return []; return PORTAL_INDEX.filter(x=>`${x.title} ${x.type} ${x.keywords}`.toLowerCase().includes(q)); }
