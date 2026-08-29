const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
const score5=v=>Math.round(clamp(v,0,5)*20);
const safeArray=v=>Array.isArray(v)?v:[];
const text=v=>typeof v==='string'?v.trim():'';
const LEVELS=[
  ['sturing','Strategie en sturing'],['commercie','Commercie en klant'],['operatie','Operatie en levering'],
  ['finance','Finance'],['mensen','Mensen en kennis'],['quality','Data'],['tech','Technologie'],
  ['analytics','AI'],['governance','Governance']
];
const level=(s,key,fallback=0)=>Number(s?.niveaus?.[key] ?? fallback)||0;
const avg=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
const hasObjectData=o=>o&&typeof o==='object'&&Object.keys(o).length>0;
function liveTimestamp(s,scan,now){return text(s?.gewijzigd)||text(s?.updatedAt)||text(scan?.datum)||new Date(now).toISOString()}
function taskTitle(t,i){return text(t?.titel)||text(t?.title)||text(t?.naam)||`Actie ${i+1}`}
function taskStatus(t){if(t?.klaar===true||t?.done===true)return'Done';return text(t?.status)||'Open'}
function taskOwner(t){return text(t?.eigenaar)||text(t?.owner)||''}
function taskDue(t){return text(t?.deadline)||text(t?.due)||''}
function decisionTitle(d,i){return text(d?.titel)||text(d?.title)||text(d?.besluit)||`Besluit ${i+1}`}
export function createEmptyPortalState({user=null,now=Date.now()}={}){const stamp=new Date(now).toISOString();return{user:user?{name:user.name||user.email||'Gebruiker',role:user.role||''}:{name:'Gebruiker',role:''},company:{name:'Bedrijf',health:null,delta:0,lastSync:'Nog niet gekoppeld',verifiedCoverage:0,potentialValue:0},managementSummary:{sections:[]},healthCards:[],roadmap:[],recommendedActions:[],monthlyImpact:[],activities:[],integrationStatus:[],quickLinks:[],graph:{nodes:[],edges:[]},signals:[],decisions:[],actions:[],valueItems:[],memories:[],agents:[],audit:[],sourceMeta:{kind:'empty',live:false,updatedAt:stamp,label:'Nog geen live bedrijfsdata gekoppeld'}}}
export function hasMeaningfulLegacyState(s){return Boolean(s&&typeof s==='object'&&(Object.keys(s.niveaus||{}).length||safeArray(s.taken).length||safeArray(s.besluiten).length||safeArray(s.docs).length||safeArray(s.log).length||hasObjectData(s.fin)||hasObjectData(s.eigen)||hasObjectData(s.cijfers)))}
export function buildPortalStateFromLegacy({legacyState,scanPackage=null,user=null,lead=null,now=Date.now()}={}){const s=legacyState&&typeof legacyState==='object'?legacyState:{};const scan=scanPackage&&typeof scanPackage==='object'?scanPackage:null;if(!hasMeaningfulLegacyState(s)&&!scan)return null;
  const levels=LEVELS.map(([key,label])=>({key,label,raw:level(s,key,scan?.dimAvg?.[key]||0)})).filter(x=>x.raw>0);
  const health=levels.length?Math.round(avg(levels.map(x=>score5(x.raw)))):(Number(scan?.score)||null);
  const sorted=[...levels].sort((a,b)=>a.raw-b.raw);const weakest=sorted.slice(0,2),strongest=[...sorted].sort((a,b)=>b.raw-a.raw).slice(0,2);
  const name=text(s?.eigen?.bedrijfsnaam)||text(s?.eigen?.bedrijf)||text(lead?.bedrijf)||'Mijn bedrijf';
  const updatedAt=liveTimestamp(s,scan,now);
  const healthCards=[
    {id:'bedrijfsgezondheid',label:'Bedrijfsgezondheid',value:health},
    {id:'kennisborging',label:'Kennisborging',value:score5(level(s,'mensen',0))||null},
    {id:'processen',label:'Processen',value:score5(level(s,'operatie',0))||null},
    {id:'data-systemen',label:'Data & systemen',value:Math.round(avg([level(s,'quality',0),level(s,'tech',0)].filter(Boolean))*20)||null},
    {id:'ai-volwassenheid',label:'AI-volwassenheid',value:score5(level(s,'analytics',0))||null}
  ];
  const tasks=safeArray(s.taken).map((t,i)=>({id:String(t?.id||`legacy-action-${i+1}`),title:taskTitle(t,i),owner:taskOwner(t),status:taskStatus(t),executed:Boolean(t?.uitgevoerd||t?.executed||taskStatus(t)==='Done'),verified:Boolean(t?.verified),result:t?.resultaat||t?.result||null,due:taskDue(t),source:text(t?.bron)||'Bestaand portaal'}));
  const decisions=safeArray(s.besluiten).map((d,i)=>({id:String(d?.id||`legacy-decision-${i+1}`),stage:text(d?.fase)||text(d?.status)||'Bestaand besluit',title:decisionTitle(d,i),why:text(d?.waarom)||text(d?.reason)||'',expected:text(d?.impact)||'',confidence:Number(d?.confidence)||null,risk:text(d?.risico)||'',owner:text(d?.eigenaar)||text(d?.owner)||'',options:safeArray(d?.opties)}));
  const docs=safeArray(s.docs).map((d,i)=>({type:'Document',title:text(d?.naam)||text(d?.title)||`Document ${i+1}`,excerpt:text(d?.omschrijving)||text(d?.description)||'',evidence:1,date:text(d?.datum)||''}));
  const log=safeArray(s.log).map((l,i)=>Array.isArray(l)?l:[text(l?.tijd)||'',text(l?.actor)||'Portaal',text(l?.tekst)||text(l?.title)||`Wijziging ${i+1}`,text(l?.status)||'Vastgelegd']);
  const graphNodes=[...levels.map(x=>({id:x.key,label:x.label,type:'health',score:score5(x.raw)})),...tasks.slice(0,12).map(x=>({id:x.id,label:x.title,type:'action'})),...decisions.slice(0,12).map(x=>({id:x.id,label:x.title,type:'decision'}))];
  const recommendations=tasks.filter(t=>t.status!=='Done').slice(0,4).map(t=>({id:t.id,kind:'Actie',title:t.title,text:t.due?`Deadline ${t.due}`:'Open actie uit bestaand portaal',meta:[t.owner?`Eigenaar ${t.owner}`:'Eigenaar ontbreekt'],action:'Bekijk actie',tone:t.owner?'attention':'risk'}));
  if(!recommendations.length)weakest.forEach(x=>recommendations.push({id:`weak-${x.key}`,kind:'Aandacht',title:`Versterk ${x.label}`,text:`Huidige volwassenheid ${x.raw.toFixed(1)} van 5.`,meta:['Afgeleid uit bestaande portaaldata'],action:'Bekijk domein',tone:'attention'}));
  return{user:{name:user?.name||user?.user_metadata?.full_name||user?.email||'Gebruiker',role:user?.role||''},company:{name,health,delta:0,lastSync:updatedAt,verifiedCoverage:0,potentialValue:0},managementSummary:{sections:[{id:'opportunities',title:'Kansen',text:strongest.length?`Sterkste domeinen: ${strongest.map(x=>x.label).join(', ')}.`:'Nog geen live kansenbron gekoppeld.'},{id:'threats',title:'Bedreigingen',text:weakest.length?`Laagste volwassenheid: ${weakest.map(x=>x.label).join(', ')}.`:'Nog geen live risicobron gekoppeld.'},{id:'trends',title:'Trends',text:'Trendberekening start zodra meerdere meetmomenten beschikbaar zijn.'},{id:'conclusion',title:'Conclusie',text:health===null?'Nog onvoldoende live data voor een bedrijfsscore.':`Bedrijfsgezondheid ${health}/100 op basis van bestaande portaaldata.`}]},healthCards,roadmap:tasks,recommendedActions:recommendations,monthlyImpact:[],activities:log.slice(0,10),integrationStatus:[],quickLinks:[{label:'Bestaand klantportaal',route:'memory/knowledge'},{label:'Besluiten',route:'decisions'},{label:'Acties',route:'execution'}],graph:{nodes:graphNodes,edges:[]},signals:[],decisions,actions:tasks,valueItems:[],memories:docs,audit:log,agents:[],sourceMeta:{kind:'legacy-local',live:true,updatedAt,label:'Bestaande portaaldata op dit apparaat'}}
}
export function readLegacyBrowserState({storage,user,now=Date.now()}={}){if(!storage)return null;const email=text(user?.email).toLowerCase();let legacy=null,scan=null,lead=null;try{if(email){const raw=storage.getItem(`bg_portaal_${email}`);if(raw)legacy=JSON.parse(raw)}const scanRaw=storage.getItem('bg_scan_pakket');if(scanRaw)scan=JSON.parse(scanRaw);const leadRaw=storage.getItem('bg_portaal_lead');if(leadRaw)lead=JSON.parse(leadRaw)}catch{return null}return buildPortalStateFromLegacy({legacyState:legacy,scanPackage:scan,user,lead,now})}
