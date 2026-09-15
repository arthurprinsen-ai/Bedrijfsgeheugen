const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const fmt=value=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(num(value));

const DEFINITIONS=Object.freeze([
 Object.freeze({key:'bmc',title:'Business Model Canvas',sections:Object.freeze([
  {id:'klantsegmenten',label:'Klantsegmenten'},{id:'waardepropositie',label:'Waardepropositie'},{id:'kanalen',label:'Kanalen'},{id:'klantrelaties',label:'Klantrelaties'},{id:'inkomsten',label:'Inkomstenstromen'},{id:'kernmiddelen',label:'Kernmiddelen'},{id:'kernactiviteiten',label:'Kernactiviteiten'},{id:'partners',label:'Kernpartners'},{id:'kosten',label:'Kostenstructuur'}])}),
 Object.freeze({key:'vpc2',title:'Waardepropositiecanvas',sections:Object.freeze([
  {id:'klanttaken',label:'Klanttaken'},{id:'pijnpunten',label:'Pijnpunten'},{id:'voordelen',label:'Gewenste voordelen'},{id:'producten',label:'Producten en diensten'},{id:'pijnverzachters',label:'Pijnverzachters'},{id:'voordeelmakers',label:'Voordeelmakers'}])}),
 Object.freeze({key:'lean',title:'Lean Canvas',sections:Object.freeze([
  {id:'probleem',label:'Probleem'},{id:'segmenten',label:'Klantsegmenten'},{id:'waarde',label:'Unieke waardepropositie'},{id:'oplossing',label:'Oplossing'},{id:'kanalen',label:'Kanalen'},{id:'inkomsten',label:'Inkomsten'},{id:'kosten',label:'Kosten'},{id:'metrics',label:'Kernmetrics'},{id:'voordeel',label:'Oneerlijk voordeel'}])}),
 Object.freeze({key:'merk',title:'Merkcanvas',sections:Object.freeze([
  {id:'belofte',label:'Merkbelofte'},{id:'doelgroep',label:'Doelgroep'},{id:'persoonlijkheid',label:'Persoonlijkheid'},{id:'bewijs',label:'Bewijs'},{id:'onderscheid',label:'Onderscheid'},{id:'toon',label:'Tone of voice'}])}),
 Object.freeze({key:'content',title:'Contentcanvas',sections:Object.freeze([
  {id:'doelgroep',label:'Doelgroep'},{id:'vraag',label:'Kernvraag'},{id:'themas',label:'Thema’s'},{id:'kanalen',label:'Kanalen'},{id:'formats',label:'Formats'},{id:'bewijs',label:'Bewijs'},{id:'ritme',label:'Ritme'}])}),
 Object.freeze({key:'sales2',title:'Salescanvas',sections:Object.freeze([
  {id:'doelgroep',label:'Ideale klant'},{id:'trigger',label:'Kooptrigger'},{id:'propositie',label:'Propositie'},{id:'kanalen',label:'Kanalen'},{id:'proces',label:'Salesproces'},{id:'bewijs',label:'Bewijs'},{id:'conversie',label:'Conversie'},{id:'retentie',label:'Retentie'}])})
]);

export function canvasSchema(){return DEFINITIONS;}

function defaults(state={}){
 const p=state?.portal||{};const profile=p.profile||{};const metrics=p.metrics||{};const market=p.market||{};
 const industry=market.industry||profile.industry||'de gekozen markt';
 const customers=num(metrics.customers);const revenue=num(metrics.revenue);const growth=num(market.growth);const nps=num(metrics.nps);const conversion=num(metrics.quoteConversion);
 const goal=profile.goal||'meetbare groei';const employees=num(profile.employees);
 const audience=customers?`${industry}; circa ${fmt(customers)} bestaande klanten`:`Organisaties in ${industry}`;
 const proof=[nps?`NPS ${fmt(nps)}`:'',customers?`${fmt(customers)} klanten`:''].filter(Boolean).join(' · ')||'Klantresultaten en operationele data';
 return {
  bmc:{klantsegmenten:audience,waardepropositie:`${goal} door bedrijfskennis, processen, data en AI aantoonbaar te verbinden`,kanalen:'Direct, digitaal en via bestaande klantrelaties',klantrelaties:'Advies, implementatie en continue verbetering',inkomsten:revenue?`Actuele omzet ${fmt(revenue)}`:'Omzet uit diensten en proposities',kernmiddelen:`Kennis, Powerhouse-data, technologie${employees?` en ${fmt(employees)} medewerkers`:''}`,kernactiviteiten:'Analyseren, verbeteren, uitvoeren en leren',partners:'Technologie-, data- en uitvoeringspartners',kosten:'Mensen, technologie, data en uitvoering'},
  vpc2:{klanttaken:`Beter sturen en groeien in ${industry}`,pijnpunten:'Versnipperde kennis, handwerk en onvoldoende voorspelbaarheid',voordelen:'Snellere besluiten, lagere frictie en meetbare businessimpact',producten:'Scan, advies, implementatie en Powerhouse-ondersteuning',pijnverzachters:'Kennis expliciet maken en processen/data verbinden',voordeelmakers:`Sturen op ${goal} met actuele evidence`},
  lean:{probleem:'Kennis zit verspreid in hoofden en systemen',segmenten:audience,waarde:`Van bedrijfskennis naar ${goal} met één verbonden Powerhouse`,oplossing:'Digitalisering, data, AI en uitvoerbare Next Best Actions',kanalen:'Website, social, e-mail, sales en klantinteractie',inkomsten:revenue?`Actuele omzetbasis ${fmt(revenue)}`:'Project-, scan- en abonnementsomzet',kosten:'Mensen, technologie, acquisitie en operatie',metrics:`Groei ${fmt(growth)}% · conversie ${fmt(conversion)}%`,voordeel:'Canonieke bedrijfscontext + gesloten learning-loop'},
  merk:{belofte:`Praktisch naar ${goal}`,doelgroep:audience,persoonlijkheid:'Menselijk, scherp en uitvoerbaar',bewijs,onderscheid:'Eén verbonden geheugen van strategie tot uitvoering',toon:'Helder, concreet en zonder buzzwords'},
  content:{doelgroep:audience,vraag:`Hoe realiseren we ${goal} zonder losse initiatieven?`,themas:'Bedrijfskennis, digitalisering, data, AI en businessimpact',kanalen:'Website, LinkedIn, e-mail en klantportaal',formats:'Cases, analyses, modellen, uitleg en concrete acties',bewijs,ritme:'Datagedreven op relevantie, timing en outcome'},
  sales2:{doelgroep:audience,trigger:'Groei stagneert, kennis is versnipperd of verandering blijft hangen',propositie:`Van analyse naar aantoonbare ${goal}`,kanalen:'Warm netwerk, inbound, outbound en partnerships',proces:'Signaal → kwalificatie → gesprek → voorstel → win/loss → learning',bewijs,conversie:conversion?`${fmt(conversion)}% offerteconversie`:'Conversie wordt uit outcomes gevoed',retentie:'Waarde aantonen, vervolgactie voorspellen en relatie verdiepen'}
 };
}

export function buildCanvasAnalysis(state={}){
 const generated=defaults(state);const stored=state?.portal?.canvases||{};const result={};
 for(const definition of DEFINITIONS){
  const saved=stored?.[definition.key]||{};const details=saved.details||{};
  const values={};
  for(const section of definition.sections)values[section.id]=String(details?.[section.id]??generated?.[definition.key]?.[section.id]??'');
  result[definition.key]=Object.freeze({key:definition.key,title:definition.title,answer:String(saved.answer||''),owner:String(saved.owner||''),values:Object.freeze(values),source:Object.keys(details).length?'Powerhouse + klantinvoer':'Powerhouse'});
 }
 const filled=Object.values(result).reduce((sum,canvas)=>sum+Object.values(canvas.values).filter(Boolean).length,0);
 result.conclusion=`De zes canvassen vormen één verbonden klantbeeld met ${filled} ingevulde bouwstenen. Klantinvoer overschrijft alleen de betreffende bouwsteen; overige waarden blijven uit actuele Powerhouse-context komen.`;
 return Object.freeze(result);
}

function statusText(status){return ({idle:'Gereed',dirty:'Niet opgeslagen',saving:'Opslaan…',saved:'Opgeslagen',error:'Opslaan mislukt'})[status]||status||'Gereed';}

export function mountCanvasWorkspace(root,{contract,view={},domainState}={}){
 if(!root?.replaceChildren)throw new TypeError('CANVAS_WORKSPACE_ROOT_REQUIRED');
 const state=()=>domainState?.get?.()||{};let active='bmc';let tab='invullen';
 const save=async(path,value)=>{if(!domainState)return;domainState.set(path,value);render();try{await domainState.flush();render();}catch{render();}};
 const render=()=>{
  const analysis=buildCanvasAnalysis(state());const current=analysis[active];const definition=DEFINITIONS.find(item=>item.key===active);
  const body=tab==='analyse'?`<section class="v2functional-card"><h3>Analyse</h3><p>${esc(analysis.conclusion)}</p><p><strong>Bron:</strong> ${esc(current.source)}</p></section>`:
   tab==='acties'?`<section class="v2functional-card"><h3>Acties</h3><p>Gebruik de ingevulde bouwstenen als context voor advies, roadmap en Next Best Action. Wijzigingen worden eerst canoniek opgeslagen voordat downstream intelligence ze gebruikt.</p></section>`:
   tab==='bewijs'?`<section class="v2functional-card"><h3>Bewijs</h3><p>Authority: <code>portal.canvases.${esc(active)}</code>. Afgeleide waarden komen uit dezelfde tenant-scoped Powerhouse-state; klantoverschrijvingen blijven traceerbaar in <code>details</code>.</p></section>`:
   `<div class="v2functional-grid">${definition.sections.map(section=>`<label class="v2functional-field"><span>${esc(section.label)}</span><textarea data-canvas-detail="${esc(section.id)}">${esc(current.values[section.id])}</textarea></label>`).join('')}<label class="v2functional-field"><span>Eigen conclusie / antwoord</span><textarea data-canvas-answer>${esc(current.answer)}</textarea></label><label class="v2functional-field"><span>Eigenaar</span><input data-canvas-owner value="${esc(current.owner)}"></label></div>`;
  root.innerHTML=`<div class="v2workspace v2workspace-functional" data-workspace="canvassen"><div class="v2workspacebar"><div><span class="v2workspaceeyebrow">Werkruimte</span><strong>${esc(view.title||'Canvassen')}</strong></div><span class="v2savestatus" data-save-status="${esc(domainState?.status?.()||'idle')}">${esc(statusText(domainState?.status?.()||'idle'))}</span></div><p class="v2workspacedescription">${esc(view.description||'Dezelfde zes volledige canvassen als het legacy-portaal, gevoed door het Powerhouse.')}</p><nav class="v2workspacetabs">${['invullen','analyse','acties','bewijs'].map(item=>`<button type="button" data-tab="${item}" aria-selected="${item===tab}">${item[0].toUpperCase()+item.slice(1)}</button>`).join('')}</nav><div class="v2functional-tabs">${DEFINITIONS.map(item=>`<button type="button" data-canvas="${item.key}" aria-pressed="${item.key===active}">${esc(item.title)}</button>`).join('')}</div><header class="v2functional-header"><h2>${esc(current.title)}</h2><span>${esc(current.source)}</span></header>${body}</div>`;
  root.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.tab;render();}));
  root.querySelectorAll('[data-canvas]').forEach(button=>button.addEventListener('click',()=>{active=button.dataset.canvas;render();}));
  root.querySelectorAll('[data-canvas-detail]').forEach(field=>field.addEventListener('change',()=>save(`portal.canvases.${active}.details.${field.dataset.canvasDetail}`,field.value)));
  root.querySelector('[data-canvas-answer]')?.addEventListener('change',event=>save(`portal.canvases.${active}.answer`,event.target.value));
  root.querySelector('[data-canvas-owner]')?.addEventListener('change',event=>save(`portal.canvases.${active}.owner`,event.target.value));
 };
 const unsubscribe=domainState?.subscribe?.(()=>render());render();
 return Object.freeze({destroy(){unsubscribe?.();},render});
}
