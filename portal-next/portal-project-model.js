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
  return Object.freeze({
    customer:Object.freeze({name:text(customer.name||customer.naam)}),
    quote:Object.freeze({
      number:text(quote.nummer),
      title:text(quote.titel||inhoud.titel),
      status:text(quote.status)||'Niet beschikbaar',
      amount:Number(quote.bedrag??inhoud.totaal)||0,
      validUntil:text(quote.geldig_tot||inhoud.geldig),
      signed:quote.getekend??inhoud.getekend??null,
      raw:inhoud
    }),
    parts:Object.freeze(parts),
    sprints:Object.freeze(withPart('sprints',(s,p,i)=>({
      id:`${p.id}:sprint:${i}`,
      partId:p.id,
      title:text(s.titel),
      work:text(s.wat),
      deliverable:text(s.op),
      status:'planned'
    }))),
    stories:Object.freeze(withPart('stories',(s,p,i)=>({
      id:`${p.id}:story:${i}`,
      partId:p.id,
      role:text(s?.[0]),
      need:text(s?.[1]),
      outcome:text(s?.[2])
    }))),
    documents:Object.freeze(withPart('documents',(d,p,i)=>({
      id:`${p.id}:document:${i}`,
      partId:p.id,
      name:text(d.naam),
      week:Number(d.week)||null,
      status:'planned'
    }))),
    integrations:Object.freeze(withPart('integrations',(k,p,i)=>({
      id:`${p.id}:integration:${i}`,
      partId:p.id,
      name:text(k.naam),
      purpose:text(k.wat),
      week:Number(k.week)||null,
      status:'planned'
    }))),
    planning:Object.freeze(arr(inhoud.planning).map((p,i)=>({
      id:`milestone:${i}`,
      label:text(p?.[0]),
      detail:text(p?.[1]),
      status:'planned'
    }))),
    licenses:inhoud.licenties||null,
    customerNeeds:Object.freeze(arr(inhoud.vanUNodig)),
    architecture:inhoud.architectuur||null,
    subscription:inhoud.doorlopend||null,
    runtime
  });
}

export const projectParts=p=>p?.parts||[];
export const projectSprints=p=>p?.sprints||[];
export const projectStories=p=>p?.stories||[];
export const projectDocuments=p=>p?.documents||[];
export const projectIntegrations=p=>p?.integrations||[];
