const text=v=>typeof v==='string'?v.trim():'';
const arr=v=>Array.isArray(v)?v:[];

export function normalizePortalProject({customer={},quote={},runtime=null}={}){
  const inhoud=quote?.inhoud&&typeof quote.inhoud==='object'?quote.inhoud:{};
  const parts=arr(inhoud.onderdelen).map((part,index)=>({
    id:text(part.id)||`part-${index+1}`,
    title:text(part.titel)||'Onderdeel',
    summary:text(part.kort),
    price:Number(part.prijs)||0,
    weeks:Number(part.weken)||0,
    required:Boolean(part.vast),
    kind:text(part.soort)||'standard',
    sprints:arr(part.sprints),
    stories:arr(part.stories),
    documents:arr(part.documenten),
    integrations:arr(part.koppelingen)
  }));
  const withPart=(key,mapper)=>parts.flatMap(p=>p[key].map((item,index)=>mapper(item,p,index)));
  const project={
    customer:Object.freeze({name:text(customer.name||customer.naam)}),
    quote:Object.freeze({
      number:text(quote.nummer),title:text(quote.titel||inhoud.titel),status:text(quote.status)||'Niet beschikbaar',
      amount:Number(quote.bedrag??inhoud.totaal)||0,validUntil:text(quote.geldig_tot||inhoud.geldig),
      signed:quote.getekend??inhoud.getekend??null,raw:inhoud
    }),
    parts:Object.freeze(parts),
    sprints:Object.freeze(withPart('sprints',(s,p,i)=>({id:`${p.id}:sprint:${i}`,partId:p.id,title:text(s.titel),work:text(s.wat),deliverable:text(s.op),status:'planned',evidence:[],outcome:null}))),
    stories:Object.freeze(withPart('stories',(s,p,i)=>({id:`${p.id}:story:${i}`,partId:p.id,role:text(s?.[0]),need:text(s?.[1]),outcome:text(s?.[2]),status:'planned',evidence:[]}))),
    documents:Object.freeze(withPart('documents',(d,p,i)=>({id:`${p.id}:document:${i}`,partId:p.id,name:text(d.naam),week:Number(d.week)||null,status:'planned',evidence:[]}))),
    integrations:Object.freeze(withPart('integrations',(k,p,i)=>({id:`${p.id}:integration:${i}`,partId:p.id,name:text(k.naam),purpose:text(k.wat),week:Number(k.week)||null,status:'planned',evidence:[]}))),
    planning:Object.freeze(arr(inhoud.planning).map((p,i)=>({id:`milestone:${i}`,label:text(p?.[0]),detail:text(p?.[1]),status:'planned',evidence:[]}))),
    licenses:inhoud.licenties||null,customerNeeds:Object.freeze(arr(inhoud.vanUNodig)),architecture:inhoud.architectuur||null,subscription:inhoud.doorlopend||null,runtime
  };
  return runtime?applyProjectRuntime(project,runtime):Object.freeze(project);
}

const evidenceList=item=>arr(item?.evidence).filter(Boolean);
const runtimeStatus=item=>{
  const evidence=evidenceList(item);
  if(evidence.length===0)return 'planned';
  if(['success','completed','verified'].includes(item?.status))return 'verified';
  if(['active','running','in_progress'].includes(item?.status))return 'active';
  if(['blocked','failed','error'].includes(item?.status))return 'blocked';
  return 'planned';
};
const mergeCollection=(collection,records)=>Object.freeze(collection.map(item=>{
  const runtime=records.get(item.id);if(!runtime)return item;
  return Object.freeze({...item,status:runtimeStatus(runtime),evidence:Object.freeze(evidenceList(runtime)),outcome:runtime?.outcome?Object.freeze({expected:runtime.outcome.expected??null,observed:runtime.outcome.observed??null,verified:runtime.outcome.verified===true}):item.outcome??null});
}));

export function applyProjectRuntime(project,runtime={}){
  const records=new Map(arr(runtime.items).filter(item=>item?.id).map(item=>[item.id,item]));
  return Object.freeze({...project,
    sprints:mergeCollection(project.sprints||[],records),stories:mergeCollection(project.stories||[],records),documents:mergeCollection(project.documents||[],records),integrations:mergeCollection(project.integrations||[],records),planning:mergeCollection(project.planning||[],records),runtime
  });
}

export const projectParts=p=>p?.parts||[];
export const projectSprints=p=>p?.sprints||[];
export const projectStories=p=>p?.stories||[];
export const projectDocuments=p=>p?.documents||[];
export const projectIntegrations=p=>p?.integrations||[];
