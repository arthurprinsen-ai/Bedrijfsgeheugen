/*
 * POWERHOUSE customer model shortlist. ALL 110 catalogue records can be requested,
 * but this module cannot grant API access, change live inference routes or waive governance.
 * Authentication + portal-domain-state are required to persist a tenant preference.
 */
const STATUS_LABELS=Object.freeze({
  VERIFIED:'Leveranciersdossier geregistreerd (geen runtimegoedkeuring)',
  PARTIAL:'Onderzoek: bewijs onvolledig',
  CONFLICT:'Geblokkeerd: tegenstrijdig bewijs',
  UNKNOWN:'Niet aantoonbaar geverifieerd'
});
const ACT_STATES=new Set(['eol','retired','deprecated']);
const FEATURED_MODELS=Object.freeze([
 ['gpt-6-luna','Dagelijkse taken','Snelle standaardverwerking'],
 ['gpt-6-sol','Bedrijfsbrein','Strategie en adviezen'],
 ['mistral-medium-3-5','Zakelijke analyse','Alternatief met mogelijke eigen hosting'],
 ['gpt-oss-20b','Eigen omgeving','Open gewichten, afzonderlijk te hosten'],
 ['mistral-ocr-3','Documentverwerking','OCR en documenten structureren'],
 ['text-embedding-3-small','Bedrijfskennis','Semantisch zoeken']
]);
const WORKLOADS=Object.freeze([
 ['brain','Bedrijfsbrein en adviezen','gpt-6-sol'],
 ['routine','Dagelijkse standaardtaken','gpt-6-luna'],
 ['analysis','Analyses en prognoses','mistral-medium-3-5'],
 ['documents','Documenten en OCR','mistral-ocr-3'],
 ['knowledge','Bedrijfskennis en zoeken','text-embedding-3-small'],
 ['sensitive','Gevoelige gegevens','gpt-oss-20b']
]);
const POLICY_OPTIONS=[
 ['review','Geen vooraf gekozen soevereiniteitsniveau; beoordeling per model'],
 ['eu-storage','Voorkeur: gegevensopslag binnen de EER'],
 ['eu-both','Voorkeur: gegevensopslag én verwerking binnen de EER'],
 ['strict','Eis: klantgestuurde of soevereine uitvoeringsomgeving']
];
const AI_RISK_OPTIONS=[
 ['unknown','Nog niet beoordeeld'],
 ['standard','Voorlopig: reguliere toepassing (nog toetsen)'],
 ['high-review','Mogelijk hoog risico: menselijke/juridische beoordeling vereist']
];
const CSS='.amc{font:inherit;color:#19233b;display:grid;gap:15px}.amc *{box-sizing:border-box}.amc section{border:1px solid #dbe3ee;border-radius:14px;padding:16px;background:white}.amc h3{margin:0 0 8px}.amc p{margin:7px 0;line-height:1.55}.amc small,.amc .hint{color:#52617a}.amc .tools{display:flex;flex-wrap:wrap;gap:10px}.amc input,.amc select{padding:9px;min-width:170px;max-width:100%;border:1px solid #cbd7e5;border-radius:9px;background:#fff;color:inherit}.amc input[type=search]{flex:1}.amc .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:10px}.amc .card{border:1px solid #dbe3ee;border-radius:12px;padding:13px;display:grid;gap:8px;align-content:start;background:#fff}.amc .card[data-status=PARTIAL]{border-left:4px solid #bb8514}.amc .card[data-status=CONFLICT]{border-left:4px solid #b52b2b}.amc .card h4{margin:0}.amc .card p{font-size:13px}.amc .tag{font-size:11px;font-weight:700;background:#f0f3f8;border-radius:6px;padding:4px 7px;display:inline-block}.amc .warn{background:#fff3e1;padding:10px;border-radius:9px}.amc .blocked{color:#9b2626}.amc .selected{background:#eef6ff}.amc button{padding:9px 12px;border:1px solid #aec0d8;border-radius:9px;background:#fff;color:inherit;cursor:pointer}.amc button.primary{background:#2255cb;color:#fff;border-color:#2255cb;font-weight:700}.amc button:disabled{opacity:.6;cursor:not-allowed}.amc a{color:#2051b8}.amc .status{font-size:13px;font-weight:650}.amc .route{padding:9px;background:#f7f9fc;border-radius:8px}.amc .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.amc .field{display:grid;gap:5px;max-width:580px}.amc .counter{font-weight:700}.amc .path{font-size:12px;word-break:break-word}@media(max-width:620px){.amc .cards{grid-template-columns:1fr}.amc select,.amc input{width:100%}}';
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const add=(parent,...nodes)=>{nodes.forEach(n=>parent.append(n));return parent};
const option=(value,label)=>{const x=el('option',null,label);x.value=value;return x};
const line=(host,key,value)=>host.append(el('p','path',key+': '+String(value??'onbekend')));
const safeSource=value=>{try{const x=new URL(value);return x.protocol==='https:'?x.href:null}catch{return null}};
function providerPaths(governance,provider){return (governance.providers||[]).find(p=>p.provider===provider)?.paths||[]}
function recordAvailability(m,status){
 if(status==='CONFLICT')return 'Geen activering: tegenstrijdige leveranciersinformatie';
 if(ACT_STATES.has(String(m.status||'').toLowerCase()))return 'Geen activering: beëindigd of verouderd model';
 if(m.record_kind==='model_family_placeholder')return 'Modelgroep, geen afzonderlijk uitvoerbare API-ID';
 if(status==='PARTIAL'||status==='UNKNOWN')return 'Nog geen activering: leveranciersbewijs onvolledig';
 return 'Gebruik alleen na afzonderlijke tenant-, regio-, contract- en runtimecontrole';
}
function readShortlist(state){
 const value=state?.portal?.aiModelPreferences||{};
 return {
  models:Array.isArray(value.models)?value.models.filter(x=>x&&typeof x.modelId==='string').map(x=>({modelId:x.modelId,routeId:String(x.routeId||'')})):[],
  policy:POLICY_OPTIONS.some(x=>x[0]===value.policy)?value.policy:'eu-both',
  aiRisk:AI_RISK_OPTIONS.some(x=>x[0]===value.aiRisk)?value.aiRisk:'unknown',
  useCase:String(value.useCase||'').slice(0,250),
   assignments:value.assignments&&typeof value.assignments==='object'&&!Array.isArray(value.assignments)?Object.fromEntries(WORKLOADS.filter(x=>typeof value.assignments[x[0]]==='string').map(x=>[x[0],String(value.assignments[x[0]])])):{}
 };
}
export async function mountAiModelChoice(root,{domainState,stateClient,openPage,fetchImpl=globalThis.fetch}={}){
 if(!root)throw new TypeError('AI_MODEL_CHOICE_ROOT_REQUIRED');
 if(!document.getElementById('aiModelChoiceStyle')){const s=el('style');s.id='aiModelChoiceStyle';s.textContent=CSS;document.head.append(s)}
 root.replaceChildren(el('p',null,'Modelcatalogus en bewijsstatus laden…'));
 const getJson=async url=>{const response=await fetchImpl(url,{cache:'no-store',credentials:'same-origin'});if(!response.ok)throw new Error('MODEL_CATALOG_READ_FAILED');return response.json()};
 let catalog,governance,snapshot;
 try{
  [catalog,governance,snapshot]=await Promise.all([
   getJson('/data/ai-model-catalog-v1.json'),
   getJson('/data/ai-provider-governance-v1.json'),
   getJson('/portal-v2/ai-model-supplier-status-v1.json')
  ]);
  if(!Array.isArray(catalog.models)||catalog.models.length!==110||
     new Set(catalog.models.map(m=>m.id)).size!==110||
     Object.keys(snapshot.records||{}).length!==110)throw new Error('MODEL_CATALOG_INCOMPLETE');
 }catch(error){
  root.replaceChildren(el('p','warn','De actuele volledige modelcatalogus of bewijsstatus is niet beschikbaar. Keuzes blijven uitgeschakeld; geen onbewezen modellen worden geactiveerd.'));
  return {ready:false,error:String(error)};
 }
 const ids=new Set(catalog.models.map(m=>m.id));
 let draft=readShortlist(domainState?.get?.()||{});
 draft.models=draft.models.filter(x=>ids.has(x.modelId));
  for(const [workload,modelId] of Object.entries(draft.assignments))if(!ids.has(modelId)||!draft.models.some(x=>x.modelId===modelId))delete draft.assignments[workload];
 let dirty=false,filter='',statusFilter='ALL',providerFilter='ALL';
 const loggedIn=()=>{const s=stateClient?.getSnapshot?.();return (s?.mode==='authenticated'||s?.mode==='empty')&&!stateClient?.isDemo?.()&&Boolean(s?.user)};
 const setMessage=(text,isError=false)=>{const x=root.querySelector('[data-amc-save-state]');if(x){x.textContent=text;x.classList.toggle('blocked',isError)}};
 const parent=el('div','amc');const intro=el('section');add(intro,el('h3',null,'Kies AI-modellen voor jouw organisatie'),
  el('p',null,'Alle 110 bestaande derde-partijmodellen zijn te bekijken en aan jouw wensenlijst toe te voegen. Een keuze is een verzoek, nooit automatische aansluiting of uitvoering met bedrijfsgegevens.'),
  el('p','warn','Een EU-datacenter is niet hetzelfde als volledige datasoevereiniteit. Controleer afzonderlijk opslag, inferentie, toegang door leverancier/subverwerkers, juridische zeggenschap, bewaartermijn, training en internationale doorgifte.'));
 const statuses=Object.values(snapshot.records);const ct=s=>statuses.filter(x=>x===s).length;
 const counters=el('p','counter',catalog.models.length+' catalogusrecords · '+ct('VERIFIED')+' leveranciersdossiers geregistreerd · '+ct('PARTIAL')+' onderzoek · '+ct('CONFLICT')+' conflict (momentopname '+snapshot.as_of+')');
 intro.append(counters);parent.append(intro);
 const settings=el('section');settings.append(el('h3',null,'Jouw eisen'));
 const form=el('div','tools');
 const policyWrap=el('label','field','Databeleid / datasoevereiniteit (voorkeur; niet automatisch afgedwongen)');
 const policy=el('select');POLICY_OPTIONS.forEach(x=>policy.append(option(x[0],x[1])));policy.value=draft.policy;policyWrap.append(policy);
 const riskWrap=el('label','field','EU AI Act: voorlopige beoordeling van de toepassing');
 const risk=el('select');AI_RISK_OPTIONS.forEach(x=>risk.append(option(x[0],x[1])));risk.value=draft.aiRisk;riskWrap.append(risk);
 const useWrap=el('label','field','Waarvoor wil je AI gebruiken? (maximaal 250 tekens)');
 const use=el('input');use.type='text';use.maxLength=250;use.placeholder='Bijvoorbeeld samenvatten van klantdocumenten';use.value=draft.useCase;useWrap.append(use);
 form.append(policyWrap,riskWrap,useWrap);settings.append(form);
 settings.append(el('p','hint','EU AI Act: AI-geletterdheid en verboden toepassingen gelden al sinds 2 februari 2025; transparantieverplichtingen voor bepaalde AI-systemen sinds 2 augustus 2026. Hoog-risicoverplichtingen worden per concrete toepassing, rol en ingangsdatum beoordeeld. Kies je model pas voor productie na toetsing van de toepassing, menselijke controle, AVG en contracten. Dit is geen compliance-certificering.'));
 const links=el('p','path');const a1=el('a',null,'EU AI Act – officiële EU-tijdlijn'),a2=el('a',null,'EDPB – internationale doorgifte');a1.href='https://ai-act-service-desk.ec.europa.eu/en/ai-act/eu-ai-act-implementation-timeline';a2.href='https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en';a1.target=a2.target='_blank';a1.rel=a2.rel='noopener';links.append(a1,' · ',a2);settings.append(links);parent.append(settings);
 const featured=el('section');featured.append(el('h3',null,'Zes aanbevolen startmodellen'),el('p','hint','Uitgelichte catalogusmodellen, niet automatisch geactiveerd of EU-gecertificeerd.'));
 const featuredCards=el('div','cards');featured.append(featuredCards);parent.append(featured);
 const allocation=el('section');allocation.append(el('h3',null,'Kies per portaalfunctie een gewenst model'),el('p','hint','Een taaktoewijzing is een verzoek, geen live koppeling met het AI-brein.'));
 const assignmentRows=el('div','amc-assignments');allocation.append(assignmentRows);parent.append(allocation);
 const bar=el('section');bar.append(el('h3',null,'Alle beschikbare catalogusrecords'));
 const toolbar=el('div','tools'),search=el('input');search.type='search';search.placeholder='Zoek model, API-ID of leverancier';
 const provider=el('select');provider.append(option('ALL','Alle leveranciers'));[...new Set(catalog.models.map(x=>x.provider))].sort().forEach(x=>provider.append(option(x,x)));
 const status=el('select');[['ALL','Alle bewijsstatussen'],['VERIFIED','Geregistreerd'],['PARTIAL','Onderzoek (26)'],['CONFLICT','Conflict (1)']].forEach(x=>status.append(option(x[0],x[1])));
 toolbar.append(search,provider,status);bar.append(toolbar);
 const count=el('p','hint');bar.append(count);const cards=el('div','cards');bar.append(cards);parent.append(bar);
 const footer=el('section');footer.append(el('h3',null,'Wensenlijst opslaan'));const save=el('button','primary','Bewaar mijn modelkeuzes');save.type='button';
 const saved=el('span','status');saved.dataset.amcSaveState='';footer.append(add(el('div','row'),save,saved));
 footer.append(el('p','hint','Opgeslagen voorkeuren blijven gescheiden van live AI-inferentie. Voor werkelijke activering zijn geverifieerde API-toegang, modelbeschikbaarheid, tenantrechten, DPA/AVG, regio, verwerking en risicoacceptatie vereist.'));
 const toPass=el('button',null,'Bekijk Data & AI Sovereignty');toPass.type='button';toPass.addEventListener('click',()=>openPage?.('data-ai-passport'));footer.append(toPass);
 parent.append(footer);
 const trial=el('section');trial.append(el('h3',null,'Test jouw goedgekeurde Bedrijfsbrein-model'),
 el('p','hint','Optionele, handmatig gestarte modeltest. Alleen jouw ingetypte tekst wordt verstuurd; portaalbestanden en bedrijfscontext gaan niet mee. Een provider wordt uitsluitend aangeroepen na de server-side controle van modelkeuze, tenant, leverancier, regio en ondertekend runtimebewijs. Een geslaagde test kan verbruikskosten hebben.'));
 const trialForm=el('div','tools'),trialQuestion=el('input');
 trialQuestion.type='text';trialQuestion.maxLength=500;
 trialQuestion.placeholder='Typ een niet-vertrouwelijke testvraag';trialQuestion.setAttribute('aria-label','Niet-vertrouwelijke modeltestvraag');
 const trialButton=el('button','primary','Test gekozen model');trialButton.type='button';
 const trialOutcome=el('p','status');trialOutcome.setAttribute('aria-live','polite');
 trialForm.append(trialQuestion,trialButton);trial.append(trialForm,trialOutcome);parent.append(trial);
 trialButton.addEventListener('click',async()=>{
  if(!loggedIn()){trialOutcome.textContent='Log in als klant voor de modeltest.';return}
  if(dirty){trialOutcome.textContent='Sla eerst je modelkeuzes en functietoewijzingen op.';return}
  if(!draft.assignments.brain||!draft.models.some(x=>x.modelId===draft.assignments.brain)){
   trialOutcome.textContent='Selecteer en bewaar eerst een model voor Bedrijfsbrein.';return;
  }
  const question=trialQuestion.value.trim();
  if(question.length<3){trialOutcome.textContent='Vul een testvraag van minimaal drie tekens in.';return}
  trialButton.disabled=true;trialOutcome.textContent='Server-side modelrechten en route controleren…';
  try{
   const response=await fetchImpl('/api/tenant-ai-inference',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify({question})
   });
   const result=await response.json().catch(()=>null);
   if(response.ok&&result?.status==='ANSWERED'&&typeof result.answer==='string')
    trialOutcome.textContent='Model '+String(result.modelId||'')+' heeft geantwoord: '+result.answer;
   else trialOutcome.textContent='Nog niet uitvoerbaar ('+String(result?.reason||result?.error||response.status).slice(0,140)+'). Geen fallback naar een andere provider.';
  }catch{trialOutcome.textContent='Geen bevestigde verbinding met de beveiligde AI-gateway; test niet geslaagd.'}
  finally{trialButton.disabled=false}
 });
 root.replaceChildren(parent);
 const selected=()=>new Map(draft.models.map(x=>[x.modelId,x.routeId]));
 const setSelected=(id,routeId,enabled)=>{
  const old=selected();if(enabled)old.set(id,routeId);else old.delete(id);
  draft.models=[...old].map(([modelId,path])=>({modelId,routeId:path}));
   for(const [workload,modelId] of Object.entries(draft.assignments))if(!old.has(modelId))delete draft.assignments[workload];
   dirty=true;setMessage('Nog niet opgeslagen');renderCards();renderFeatured();renderAssignments()
 };
 function routePanel(m,selectedRoute){
  const panel=el('div','route');
  const paths=providerPaths(governance,m.provider);
  const p=paths.find(x=>x.id===selectedRoute)||paths[0]||null;
  panel.append(el('strong',null,selectedRoute?'Aangevraagde uitvoeringsroute':'Voorbeeld van providerroute, niet gekozen'));
  if(!p){panel.append(el('p','hint','Geen modelroute met controleerbaar dataprofiel gevonden. Opslag, verwerking en soevereiniteit onbekend.'));return panel}
  panel.append(el('p',null,p.label||p.id));
  line(panel,'Opslag',p.storage_residency);line(panel,'Inferentie / verwerking',p.inference_residency);
  line(panel,'Training op API-data',p.training_on_api_data);
  line(panel,'Bewaartermijn',p.default_content_retention);
  line(panel,'Zero data retention',p.zero_data_retention);
  line(panel,'Beheerde sleutels',p.customer_managed_keys);
  line(panel,'Privénetwerk',p.private_networking);
  line(panel,'Eigen hosting',p.self_host===true?'Mogelijk bij deze route; beheer zelf controleren':'Niet aangetoond');
  line(panel,'Soevereiniteitsprofiel leverancier',p.sovereignty_level);
  const url=safeSource(p.source);if(url){const link=el('a',null,'Leveranciersdocumentatie ↗');link.href=url;link.target='_blank';link.rel='noopener';panel.append(link)}
  panel.append(el('p','hint','Dit zijn leveranciersbeschrijvingen; geen bewijs van klantcontract, EU-jurisdictie, daadwerkelijke regio of toegestane runtime.'));
  return panel;
 }
 function card(m){
  const supplierStatus=snapshot.records[m.id]||'UNKNOWN';
  const wrap=el('article','card');wrap.dataset.status=supplierStatus;
  const picked=selected(),chosen=picked.has(m.id),pathId=picked.get(m.id)||'';
  if(chosen)wrap.classList.add('selected');
  wrap.append(el('h4',null,m.id),el('small',null,m.provider||'Leverancier onbekend'),el('span','tag',STATUS_LABELS[supplierStatus]||STATUS_LABELS.UNKNOWN));
  if(m.provider_api_id)wrap.append(el('p','path','API-ID: '+m.provider_api_id));
  const lifecycle=recordAvailability(m,supplierStatus);wrap.append(el('p',supplierStatus==='CONFLICT'?'blocked':'hint',lifecycle));
  if(supplierStatus==='PARTIAL'){
   const pending=[...new Set([...(Array.isArray(m.supplier_audit?.missing_claim_receipts)?m.supplier_audit.missing_claim_receipts:[]),...(Array.isArray(m.supplier_audit?.review_required_claims)?m.supplier_audit.review_required_claims:[])])];
   wrap.append(el('p','warn',pending.length?'Nog te controleren: '+pending.join(', '):'Een of meer leveranciersclaims zijn nog niet onafhankelijk bevestigd.'));
  }
  if(supplierStatus==='CONFLICT')wrap.append(el('p','warn blocked','Tegenstrijdige bronnen: leverancier en geautoriseerde account-/regiocontrole vereist.'));
  if(m.strengths?.length)wrap.append(el('p','hint','Sterk in: '+m.strengths.slice(0,3).join(', ')));
  const official=safeSource(m.source);if(official){const a=el('a',null,'Officiële modelbron ↗');a.href=official;a.target='_blank';a.rel='noopener';wrap.append(a)}
  const choice=el('button',chosen?'primary':'',chosen?'Verwijder van wensenlijst':'Selecteer als gewenst model');choice.type='button';
  choice.setAttribute('aria-pressed',String(chosen));choice.addEventListener('click',()=>setSelected(m.id,pathId,!chosen));wrap.append(choice);
  if(chosen){
   const route=el('select');route.setAttribute('aria-label','Gewenste verwerkingsroute voor '+m.id);
   route.append(option('','Nog geen uitvoeringsroute geselecteerd'));
   for(const p of providerPaths(governance,m.provider))route.append(option(p.id,p.label||p.id));
   route.value=pathId;route.addEventListener('change',()=>setSelected(m.id,route.value,true));
   wrap.append(route);
  }
  wrap.append(routePanel(m,pathId));
  return wrap;
 }
 function renderFeatured(){
  featuredCards.replaceChildren(...FEATURED_MODELS.map(([id,role,description])=>{
    const m=catalog.models.find(x=>x.id===id);
    if(!m)return el('p','warn',id+' niet gevonden in catalogus');
    const panel=el('article','card');
    panel.append(el('h4',null,id),el('strong',null,role),el('p','hint',description),el('span','tag',STATUS_LABELS[snapshot.records[id]]||STATUS_LABELS.UNKNOWN));
    const picked=selected().has(id),button=el('button',picked?'primary':'',picked?'Op wensenlijst':'Toevoegen aan wensenlijst');
    button.type='button';button.disabled=picked;button.addEventListener('click',()=>setSelected(id,'',true));
    panel.append(button);return panel;
  }));
 }
 function renderAssignments(){
  const models=draft.models.map(x=>catalog.models.find(m=>m.id===x.modelId)).filter(Boolean);
  assignmentRows.replaceChildren(...WORKLOADS.map(([key,label,suggested])=>{
    const field=el('label','field',label),control=el('select');
    control.setAttribute('aria-label','Gewenst model voor '+label);
    control.append(option('','Nog geen toewijzing · suggestie: '+suggested));
    for(const m of models)control.append(option(m.id,m.provider+' · '+m.id));
    control.value=models.some(m=>m.id===draft.assignments[key])?draft.assignments[key]:'';
    control.addEventListener('change',()=>{if(control.value)draft.assignments[key]=control.value;else delete draft.assignments[key];dirty=true;setMessage('Nog niet opgeslagen')});
    field.append(control);return field;
  }));
  assignmentRows.append(el('p','hint','Server-side activering vereist nog goedgekeurde provider-toegang, model- en regiochecks, klantcontract en autorisatie.'));
 }
 function renderCards(){
  const q=filter.toLocaleLowerCase('nl'),results=catalog.models.filter(m=>(statusFilter==='ALL'||(snapshot.records[m.id]||'UNKNOWN')===statusFilter)&&
  (providerFilter==='ALL'||m.provider===providerFilter)&&(!q||(m.id+' '+m.provider+' '+m.provider_api_id+' '+(m.strengths||[]).join(' ')).toLocaleLowerCase('nl').includes(q)));
  count.textContent=results.length+' van 110 weergegeven · '+draft.models.length+' geselecteerd · status per model gebaseerd op leveranciersevidence van '+snapshot.as_of;
  cards.replaceChildren(...results.map(card));
 }
 policy.addEventListener('change',()=>{draft.policy=policy.value;dirty=true;setMessage('Nog niet opgeslagen')});
 risk.addEventListener('change',()=>{draft.aiRisk=risk.value;dirty=true;setMessage('Nog niet opgeslagen')});
 use.addEventListener('input',()=>{draft.useCase=use.value.slice(0,250);dirty=true;setMessage('Nog niet opgeslagen')});
 search.addEventListener('input',()=>{filter=search.value;renderCards()});
 provider.addEventListener('change',()=>{providerFilter=provider.value;renderCards()});
 status.addEventListener('change',()=>{statusFilter=status.value;renderCards()});
 save.disabled=!loggedIn()||!domainState?.set||!domainState?.flush;
 saved.textContent=save.disabled?'Log in als klant om voorkeuren veilig op te slaan.':'Nog geen nieuwe wijzigingen opgeslagen';
 save.addEventListener('click',async()=>{
  if(!loggedIn()||!domainState?.set||!domainState?.flush){setMessage('Alleen een aangemelde klant kan opslaan.',true);return}
  save.disabled=true;setMessage('Bezig met opslaan…');
  try{
   const payload={schemaVersion:2,models:draft.models,assignments:draft.assignments,policy:draft.policy,aiRisk:draft.aiRisk,useCase:draft.useCase,requestState:'review_only_not_activated',updatedAt:new Date().toISOString()};
   domainState.set('portal.aiModelPreferences',payload);
   // Projection store uses sourceMeta.updatedAt for optimistic stale-write rejection.
   domainState.set('sourceMeta.updatedAt',payload.updatedAt);
   await domainState.flush();
   const readback=domainState.get('portal.aiModelPreferences');
   if(JSON.stringify(readback?.models)!==JSON.stringify(payload.models)||JSON.stringify(readback?.assignments)!==JSON.stringify(payload.assignments)||readback?.policy!==payload.policy||readback?.requestState!=='review_only_not_activated')throw new Error('TENANT_READBACK_MISMATCH');
   dirty=false;setMessage('Wensenlijst opgeslagen en teruggelezen uit jouw klantomgeving.');
  }catch(error){setMessage('Opslaan niet bevestigd; controleer verbinding en klantrechten.',true)}
  finally{save.disabled=!loggedIn()}
 });
 renderCards();renderFeatured();renderAssignments();
 return {ready:true,modelCount:catalog.models.length,statusDate:snapshot.as_of,hasUnsavedChanges:()=>dirty};
}
