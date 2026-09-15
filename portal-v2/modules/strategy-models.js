const number=value=>Number.isFinite(Number(value))?Number(value):0;
const one=value=>number(value).toFixed(1);

export const BCG_MARKET_GROWTH_THRESHOLD=1.5;

const META=Object.freeze({
 Ster:Object.freeze({label:'Ster',interpretation:'Groeiende markt, sterke positie. Investeren zolang het duurt.',tone:'goed'}),
 Melkkoe:Object.freeze({label:'Melkkoe',interpretation:'Trage markt, sterke positie. Hier haal je het geld voor de rest.',tone:'goed'}),
 Vraagteken:Object.freeze({label:'Vraagteken',interpretation:'Groeiende markt, achterstand. Kiezen: investeren of loslaten.',tone:'kans'}),
 Hond:Object.freeze({label:'Hond',interpretation:'Trage markt, achterstand. Niet groeien maar opruimen.',tone:'dreig'})
});

export function bcgModel({growth,companyMaturity,industryDigitalMaturity}={}){
 const marketGrowth=number(growth);
 const own=number(companyMaturity);
 const benchmark=number(industryDigitalMaturity);
 const highGrowth=marketGrowth>BCG_MARKET_GROWTH_THRESHOLD;
 const strongPosition=own>=benchmark;
 const quadrant=highGrowth?(strongPosition?'Ster':'Vraagteken'):(strongPosition?'Melkkoe':'Hond');
 const meta=META[quadrant];
 return Object.freeze({
  source:'Model BCG',model:'BCG-matrix',quadrant,
  marketGrowth,companyMaturity:own,industryDigitalMaturity:benchmark,
  marketGrowthThreshold:BCG_MARKET_GROWTH_THRESHOLD,highGrowth,strongPosition,
  interpretation:meta.interpretation,tone:meta.tone,
  explanation:`Je sector groeit met ${one(marketGrowth)}%; jouw niveau is ${one(own)} tegenover ${one(benchmark)} in de branche. ${meta.interpretation}`,
  quadrants:Object.freeze(Object.entries(META).map(([key,value])=>Object.freeze({key,...value,active:key===quadrant})))
 });
}

export function buildBcgAction(input={}){
 const model=bcgModel(input);
 if(model.quadrant!=='Vraagteken')return null;
 return Object.freeze({
  title:'Kiezen: investeren in dit onderdeel of het loslaten',
  dimension:'tech',durationWeeks:6,value:0,source:'Model BCG',
  why:`BCG: groeiende markt maar achterstand op je branche (${one(model.companyMaturity)} tegen ${one(model.industryDigitalMaturity)}). Een vraagteken blijft niet vanzelf een ster.`
 });
}

export function bcgInputFromPortalState(state={}){
 const portal=state?.portal||{};
 const maturity=portal?.profile?.maturity||{};
 const values=Object.values(maturity).map(number).filter(value=>value>0);
 const companyMaturity=number(portal?.strategy?.bcg?.companyMaturity)||(values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0);
 return {
  growth:number(portal?.strategy?.bcg?.growth??portal?.market?.growth),
  companyMaturity,
  industryDigitalMaturity:number(portal?.strategy?.bcg?.industryDigitalMaturity??portal?.market?.digitalMaturity)
 };
}
