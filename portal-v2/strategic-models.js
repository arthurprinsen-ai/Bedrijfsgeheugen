const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const nl=(v,d=1)=>n(v).toLocaleString('nl-NL',{minimumFractionDigits:d,maximumFractionDigits:d});
function portal(s){return s?.portal||{}}
function profile(s){return portal(s).profile||{}}
function market(s){return portal(s).market||{}}
function maturityValues(s){const p=profile(s),src=p.maturity||p.dimensions||{};return Object.values(src).map(Number).filter(v=>Number.isFinite(v)&&v>=1&&v<=5)}
function companyMaturity(s){const xs=maturityValues(s);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0}
function branchGrowth(s){const m=market(s);return n(m.growth??m.industryGrowth??m.brancheGrowth,0)}
function branchDigital(s){const m=market(s);return n(m.digitalMaturity??m.digitalIntensity??m.benchmarkDigitalMaturity,0)}

export const BCG_QUADRANTS=Object.freeze([
 Object.freeze({id:'ster',label:'Ster',description:'Groeiende markt, sterke positie. Investeren zolang het duurt.'}),
 Object.freeze({id:'melkkoe',label:'Melkkoe',description:'Trage markt, sterke positie. Hier haal je het geld voor de rest.'}),
 Object.freeze({id:'vraagteken',label:'Vraagteken',description:'Groeiende markt, achterstand. Kiezen: investeren of loslaten.'}),
 Object.freeze({id:'hond',label:'Hond',description:'Trage markt, achterstand. Niet groeien maar opruimen.'})
]);

const BCG_LEGACY_GUIDANCE='Het gemarkeerde vak is waar je nu staat, afgeleid uit sectorgroei en je eigen niveau. Heb je meerdere diensten? Zet ze los in dit raster — dan zie je waar je aandacht heen moet.';

function roadmapActionFor(quadrant){
 if(quadrant!=='vraagteken')return null;
 return Object.freeze({
  id:'bcg-vraagteken-investeren-of-loslaten',
  title:'BCG Vraagteken: investeren of loslaten',
  dimension:'Strategie',
  owner:'',
  progress:0,
  sprint:1,
  start:1,
  duration:1,
  done:false,
  source:'bcg',
  sourceQuadrant:'vraagteken'
 });
}

export function upsertBcgRoadmapAction(items=[],model={}){
 const current=Array.isArray(items)?items.map(item=>({...item})):[];
 const action=model?.roadmapAction;
 if(!action)return current;
 const index=current.findIndex(item=>String(item?.id||'')===action.id||(item?.source===action.source&&item?.sourceQuadrant===action.sourceQuadrant));
 if(index<0)return[...current,{...action}];
 current[index]={...current[index],...action};
 return current;
}

export function buildBcgModel(state={}){
 const growth=branchGrowth(state),own=companyMaturity(state),baseline=branchDigital(state),highGrowth=growth>1.5,strong=own>=baseline,currentQuadrant=highGrowth?(strong?'ster':'vraagteken'):(strong?'melkkoe':'hond'),note=String(portal(state).strategicModels?.bcg?.note||''),explanation=`Twee assen: marktgroei en je eigen positie. Je sector groeit met ${nl(growth)}%; jouw niveau is ${nl(own)} tegenover ${nl(baseline)} in de branche.`,conclusion={ster:'Je positie is sterk in een groeiende markt: gericht blijven investeren en bewijs van rendement vasthouden.',melkkoe:'Je positie is sterk in een tragere markt: rendement oogsten en selectief financieren wat daarna komt.',vraagteken:'De markt groeit, maar je positie blijft achter: kies expliciet waar je investeert om een ster te worden en laat de rest los.',hond:'De markt groeit beperkt en je positie blijft achter: stop met vanzelfsprekend doorinvesteren en bewijs eerst strategische waarde.'}[currentQuadrant];
 return{
  id:'bcg',
  title:'BCG-matrix',
  source:'Boston Consulting Group',
  marketGrowth:growth,
  companyMaturity:own,
  branchDigitalMaturity:baseline,
  growthThreshold:1.5,
  currentQuadrant,
  quadrants:BCG_QUADRANTS.map(q=>({...q,current:q.id===currentQuadrant})),
  explanation,
  legacyGuidance:BCG_LEGACY_GUIDANCE,
  conclusion,
  note,
  notePath:'portal.strategicModels.bcg.note',
  prompt:'Wat zijn je diensten, en welk vak past bij elk?',
  roadmapAction:roadmapActionFor(currentQuadrant)
 };
}

export function buildStrategicModels(state={}){return[buildBcgModel(state)]}
