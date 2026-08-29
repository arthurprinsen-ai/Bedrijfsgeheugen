export const PORTAL_LAYERS=Object.freeze({LEGACY:'legacy-migration',CANONICAL:'canonical-brain'});
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:[];
const identity=(x,i)=>String(x?.id??x?.key??x?.label??x?.title??x?.name??JSON.stringify(x)??i);
function mergeArray(legacy,canonical){const map=new Map();arr(legacy).forEach((x,i)=>map.set(identity(x,i),x));arr(canonical).forEach((x,i)=>{const k=identity(x,i);map.set(k,typeof x==='object'&&typeof map.get(k)==='object'?{...map.get(k),...x}:x)});return [...map.values()]}
function mergeGraph(a,b){const left=obj(a),right=obj(b);return{...left,...right,nodes:mergeArray(left.nodes,right.nodes),edges:[...new Map([...arr(left.edges),...arr(right.edges)].map(x=>[JSON.stringify(x),x])).values()]}}
function mergeAdmin(a,b){const left=obj(a),right=obj(b);const out={...left,...right};for(const k of new Set([...Object.keys(left),...Object.keys(right)]))if(typeof left[k]==='object'&&typeof right[k]==='object'&&!Array.isArray(left[k])&&!Array.isArray(right[k]))out[k]={...left[k],...right[k]};return out}
const ARRAY_KEYS=new Set(['healthCards','roadmap','recommendedActions','monthlyImpact','activities','quickLinks','signals','decisions','actions','valueItems','memories','agents','audit']);
export function composePortalProjectionLayers({legacy=null,canonical=null}={}){
 const l=obj(legacy?.data||legacy),c=obj(canonical?.data||canonical);const out={...l};
 for(const [key,value] of Object.entries(c)){
   if(ARRAY_KEYS.has(key))out[key]=mergeArray(l[key],value);
   else if(key==='company')out.company={...obj(l.company),...obj(value)};
   else if(key==='graph')out.graph=mergeGraph(l.graph,value);
   else if(key==='admin')out.admin=mergeAdmin(l.admin,value);
   else if(key==='sourceMeta')out.sourceMeta={...obj(l.sourceMeta),...obj(value)};
   else out[key]=value;
 }
 const times=[legacy?.sourceUpdatedAt,canonical?.sourceUpdatedAt,l?.sourceMeta?.updatedAt,c?.sourceMeta?.updatedAt].map(x=>Date.parse(x||0)||0);
 const updatedAt=new Date(Math.max(0,...times)||Date.now()).toISOString();
 return{...out,sourceMeta:{...obj(out.sourceMeta),kind:canonical?'server-composed':'server',live:true,label:canonical?'Bedrijfsgeheugen canonical + legacy':'Bedrijfsgeheugen serverstate',updatedAt}};
}
function upsert(list,item){return mergeArray(list,[item])}
const priorityFromRisk=r=>{const n=Number(r);return Number.isFinite(n)&&n>=70?'Hoog':Number.isFinite(n)&&n>=40?'Middel':'Laag'};
export function projectCanonicalObject(layerState={},canonicalObject){
 if(!canonicalObject?.id||!canonicalObject?.tenantId||!canonicalObject?.type)throw new TypeError('canonical object id, tenantId and type are required');
 const d=obj(canonicalObject.data),next={...obj(layerState)};const id=canonicalObject.id;const updatedAt=canonicalObject.updatedAt||canonicalObject.createdAt||new Date().toISOString();
 switch(canonicalObject.type){
  case 'ExternalSignal':case 'Signal':case 'Risk':
   next.signals=upsert(next.signals,{id,category:d.category||canonicalObject.type,title:d.title||d.text||id,source:canonicalObject.provenance?.sourceRef||canonicalObject.provenance?.sourceType||'Brain',status:d.status||canonicalObject.lifecycle||'Active',confidence:Number(d.confidence)||null,impact:d.impact||priorityFromRisk(canonicalObject.risk),affected:arr(d.affected),summary:d.summary||d.text||'',updatedAt});break;
  case 'Recommendation':
   next.recommendedActions=upsert(next.recommendedActions,{id,title:d.title||d.text||id,priority:d.priority||priorityFromRisk(canonicalObject.risk),source:d.sourceSignalId||canonicalObject.provenance?.sourceRef||'Brain',confidence:Number(d.confidence)||null,updatedAt});break;
  case 'Decision':
   next.decisions=upsert(next.decisions,{id,stage:canonicalObject.lifecycle||'Besloten',title:d.title||d.reason||id,why:d.reason||'',expected:d.expectedImpact||'',confidence:Number(d.confidence)||null,risk:d.risk||'',owner:d.owner||canonicalObject.provenance?.sourceRef||'',options:arr(d.options),updatedAt});break;
  case 'Change':case 'Action':
   next.actions=upsert(next.actions,{id,title:d.title||d.proposedAction||id,owner:d.owner||'',status:canonicalObject.lifecycle||'Active',executed:Boolean(d.executionId||d.executed),verified:String(canonicalObject.verification||'').toLowerCase()==='verified'||Boolean(d.verifiedAt),result:d.result||d.observed||null,due:d.due||'',source:d.decisionId||canonicalObject.provenance?.sourceRef||'Brain',updatedAt});break;
  case 'Learning':case 'Lesson':
   next.memories=upsert(next.memories,{id,type:'Lesson',title:d.title||`Learning ${id}`,excerpt:d.text||d.observedImpact||d.result||'',evidence:arr(d.evidenceRefs).length,date:updatedAt,updatedAt});break;
  case 'Knowledge':case 'Document':
   next.memories=upsert(next.memories,{id,type:canonicalObject.type,title:d.title||d.name||id,excerpt:d.summary||d.description||'',evidence:arr(d.evidenceRefs).length,date:updatedAt,updatedAt});break;
  case 'BusinessHealth':
   next.company={...obj(next.company),health:Number.isFinite(Number(d.score))?Number(d.score):next.company?.health,lastSync:updatedAt};if(d.domainId)next.healthCards=upsert(next.healthCards,{id:d.domainId,label:d.label||d.domainId,value:Number(d.value??d.score),delta:Number(d.delta)||0,tone:d.tone||'blue',trend:arr(d.trend)});break;
  default:
   next.audit=upsert(next.audit,{id:`audit-${id}`,time:updatedAt,actor:canonicalObject.provenance?.sourceRef||'Brain',event:`${canonicalObject.type} ${id} bijgewerkt`,status:canonicalObject.verification||canonicalObject.lifecycle||'Vastgelegd'});
 }
 next.sourceMeta={kind:'canonical-brain',live:true,label:'Canonical Brain projectie',updatedAt};return next;
}
