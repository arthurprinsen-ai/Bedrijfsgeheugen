const arr=v=>Array.isArray(v)?v:[];
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const slug=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

export function strategyFindingToRoadmap(item={},index=0){
  const title=String(item.finding||item.title||'Strategische actie').trim();
  return Object.freeze({
    title,
    dimension:String(item.dimension||item.dim||'sturing'),
    start:1,
    duration:Math.max(1,Math.min(12,Math.ceil(num(item.horizon)||3))),
    owner:String(item.owner||''),
    progress:0,done:false,status:'Gepland',
    value:num(item.value),
    sourceFindingId:String(item.id||`strategy:${slug(title)}:${index}`),
    source:'strategy-finding'
  });
}

export function adviceItemToRoadmap(item={},index=0){
  const title=String(item.advice||item.title||item.label||'Adviesactie').trim();
  const weeks=Math.max(1,num(item.duration)||4);
  return Object.freeze({
    title,
    dimension:String(item.dimension||item.dim||'advies'),
    start:1,
    duration:Math.max(1,Math.min(12,Math.ceil(weeks/4))),
    owner:String(item.owner||''),
    progress:0,done:false,status:'Gepland',
    value:num(item.value),
    priority:num(item.priority),
    sourceFindingId:String(item.id||`advice:${slug(title)}:${index}`),
    source:'advice-item'
  });
}

export function changeToTasks(change={},defaults={}){
  const title=String(change.change||change.title||defaults.theme||'Wijziging opvolgen').trim();
  const area=String(change.area||defaults.department||'Algemeen');
  const owner=String(change.owner||defaults.owner||'');
  const due=String(change.due||defaults.due||'');
  const impact=Math.max(1,Math.min(5,num(change.impact)||1));
  const baseId=String(change.id||`change:${slug(title)}`);
  const tasks=[
    {title:`Bepaal impact van: ${title}`,department:area,owner,due,status:'Open',sourceChangeId:baseId,kind:'impact'},
    {title:`Voer wijziging uit: ${title}`,department:area,owner,due,status:'Open',sourceChangeId:baseId,kind:'implementation'}
  ];
  if(impact>=4)tasks.push({title:`Borg en verifieer: ${title}`,department:area,owner,due,status:'Open',sourceChangeId:baseId,kind:'assurance'});
  return Object.freeze(tasks.map(Object.freeze));
}

export function appendUnique(existing=[],incoming=[],key='sourceFindingId'){
  const out=[...arr(existing)];
  const seen=new Set(out.map(x=>String(x?.[key]||'')));
  for(const item of arr(incoming)){
    const id=String(item?.[key]||'');
    if(id&&seen.has(id))continue;
    out.push(item);if(id)seen.add(id);
  }
  return out;
}

export function moveRoadmapItem(items=[],index=0,start=1,duration){
  const next=arr(items).map(x=>({...x}));
  if(!next[index])return next;
  next[index].start=Math.max(1,Math.min(12,Math.round(num(start)||1)));
  if(duration!=null)next[index].duration=Math.max(1,Math.min(12,Math.round(num(duration)||1)));
  return next;
}
export function toggleRoadmapDone(items=[],index=0){
  const next=arr(items).map(x=>({...x}));if(!next[index])return next;
  next[index].done=!Boolean(next[index].done);next[index].progress=next[index].done?100:Math.min(99,num(next[index].progress));
  next[index].status=next[index].done?'Afgerond':'Bezig';return next;
}
export function removeRoadmapItem(items=[],index=0){return arr(items).filter((_,i)=>i!==index)}
export const LEGACY_ACTION_PARITY_VERSION='2026-09-18-v1';
