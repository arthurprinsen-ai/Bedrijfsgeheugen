/* Canonical CMS Studio progressive enhancement.
   Auth, draft persistence, publishing and version checks remain in the original cms-admin.js/API.
   Never create a publisher, approval, shadow data store or independent metric. */
import { cmsQuality, cmsSafeUrl } from './cms-quality-gate.mjs';

const $ = (s, root=document) => root.querySelector(s);
const studio = { ready:false, host:null, fields:null, feedback:null, preview:null, dashboard:null };
const types = {
  text:[['text','Tekst','textarea'],['source_refs','Bronnen (één URL per regel)','lines']],
  link:[['text','Link- of knoptekst','input'],['href','Bestemming (https:// of intern pad)','input']],
  image:[['src','Afbeeldingsadres','input'],['alt','Alternatieve tekst','textarea'],['decorative','Decoratieve afbeelding','checkbox']],
  meta:[['content','Meta-inhoud','textarea'],['source_refs','Bronnen (één URL per regel)','lines']],
  html:[['html','HTML-fragment (expertmodus)','textarea']],
  toggle:[['hidden','Element verbergen','checkbox']],
  structured:[['objective','Commercieel doel','input'],['audience','Doelgroep','input'],['problem','Klantprobleem','textarea'],['offer','Propositie','textarea'],['primary_cta','Gewenste actie','input'],['source_refs','Bronnen (één URL per regel)','lines']],
  attribute:[]
};
function content(){
  try {
    const value = JSON.parse($('#content')?.value || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value;
  } catch { return null; }
}
function selectedType(){ return $('#elementType')?.value || 'text'; }
function labelInput(spec, value){
  const [key,title,kind] = spec;
  const label=document.createElement('label'); label.className='cms-studio-field';
  const cap=document.createElement('span'); cap.textContent=title; label.append(cap);
  const input=document.createElement(kind==='textarea'||kind==='lines'?'textarea':'input');
  if(kind==='checkbox'){input.type='checkbox';input.checked=value===true;}
  else {input.value=kind==='lines'?(Array.isArray(value)?value.join('\n'):''):String(value??'');}
  if(kind==='textarea'||kind==='lines')input.rows=kind==='textarea'?4:2;
  if(key==='href'||key==='src')input.setAttribute('inputmode','url');
  input.dataset.field=key;
  input.addEventListener(kind==='checkbox'?'change':'input',()=>{
    const current=content();
    if(!current){announce('De geavanceerde JSON is ongeldig. Herstel die voordat je verdergaat.',true);return;}
    current[key]=kind==='checkbox'?input.checked:kind==='lines'?input.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean):input.value;
    $('#content').value=JSON.stringify(current,null,2);
    $('#content').dispatchEvent(new Event('input',{bubbles:true}));
    review();
  });
  label.append(input);return label;
}
function announce(message,error=false){if(studio.feedback){studio.feedback.textContent=message;studio.feedback.dataset.error=error?'true':'false';}}
function renderFields(){
  if(!studio.ready)return;
  const value=content(),type=selectedType();studio.fields.replaceChildren();
  if(!value){announce('De JSON is ongeldig. Je bestaande invoer is behouden; herstel deze in Geavanceerd.',true);return;}
  const specs=types[type]||[];
  if(!specs.length){
    const p=document.createElement('p');p.textContent='Dit type gebruik je via Geavanceerd. Bestaande waarden worden nooit stilzwijgend verwijderd.';studio.fields.append(p);
  }else specs.forEach(spec=>studio.fields.append(labelInput(spec,value[spec[0]])));
  const note=document.createElement('p');note.className='cms-studio-hint';
  note.textContent=type==='structured'?'Redactionele briefing: opgeslagen als gestructureerd CMS-object. Alleen een gekoppelde website- of portaalcomponent kan dit presenteren.':
    type==='html'?'Actieve HTML wordt door de originele kwaliteitscontrole geblokkeerd. Gebruik bij voorkeur veilige gestructureerde blokken.':
    'Wijzigingen blijven concept totdat je via de originele CMS-workflow opslaat en bevoegd publiceert.';
  studio.fields.append(note);review();
}
function currentItem(){
  return {surface:$('#surface')?.value,locale:$('#locale')?.value,route:$('#route')?.value,
    area:$('#area')?.value,element_key:$('#elementKey')?.value,element_type:selectedType(),
    selector:$('#selector')?.value,content:content()};
}
function review(){
  if(!studio.feedback)return;
  const item=currentItem(),quality=cmsQuality(item);
  const checks=[];
  if(item.element_type==='text'&&String(item.content?.text||'').trim().length<12)checks.push('De tekst is erg kort: controleer of deze waarde toevoegt.');
  if(item.element_type==='link'&&/^(meer|more|klik hier|click here)$/i.test(String(item.content?.text||'').trim()))checks.push('Maak de actie concreet en relevant.');
  if(item.area==='seo'&&item.element_type==='meta'&&String(item.content?.content||'').length>160)checks.push('Controleer de lengte van deze meta-omschrijving.');
  const parts=[quality.errors.length?'Blokkerend: '+quality.errors.join(', '):'Technische conceptcontrole: geen blokkerende fouten',
    quality.warnings.length?'Let op: '+quality.warnings.join(', '):null,...checks];
  announce(parts.filter(Boolean).join(' · ')+'. Dit is géén servergoedkeuring of publicatiebewijs.',Boolean(quality.errors.length));
}
function preview(){
  const item=currentItem(),frame=$('#previewFrame');
  if(!frame){announce('Open eerst een previewpagina.',true);return;}
  const value=item.content;if(!value||!item.selector){announce('Selecteer eerst een element en voer geldige content in.',true);return;}
  let doc;
  try{if(frame.contentWindow.location.origin!==location.origin)throw new Error('Andere origin');doc=frame.contentDocument;}catch{announce('Preview is alleen beschikbaar voor pagina’s op dezelfde website.',true);return;}
  if(!doc){announce('Preview nog niet geladen.',true);return;}
  let nodes;try{nodes=[...doc.querySelectorAll(item.selector)].slice(0,25);}catch{announce('De selector is ongeldig.',true);return;}
  if(!nodes.length){announce('Er is geen element gevonden op de huidige previewpagina.',true);return;}
  const type=item.element_type;
  if(!['text','link','image','meta','toggle'].includes(type)){announce('Voor dit type is geen veilige live-conceptpreview beschikbaar.',true);return;}
  nodes.forEach(el=>{
    if(type==='text')el.textContent=String(value.text??'');
    if(type==='link'){
      el.textContent=String(value.text??'');
      if(cmsSafeUrl(value.href,{link:true}))el.setAttribute('href',value.href);
    }
    if(type==='image'){
      if(cmsSafeUrl(value.src))el.setAttribute('src',value.src);
      el.setAttribute('alt',String(value.alt??''));
    }
    if(type==='meta')el.setAttribute('content',String(value.content??''));
    if(type==='toggle')el.hidden=value.hidden===true;
  });
  announce('Conceptvoorbeeld op '+nodes.length+' element(en) toegepast. Dit verandert de echte website NIET. Gebruik Opslaan en de originele goedgekeurde publicatieroute.');
}
function dashboard(){
  if(!studio.dashboard)return;
  const source=$('#cmsLoopSummary'),state=$('#cmsPowerhouseLoop')?.dataset.status;
  studio.dashboard.textContent=source?.textContent||'CMS- en Heartbeat-bronbewijs nog niet beschikbaar.';
  studio.dashboard.dataset.status=state||'UNAVAILABLE';
}
function init(){
  const editor=$('#editor'),json=$('#content');if(!editor||!json||studio.ready)return;
  const originalLabel=json.closest('label');if(!originalLabel)return;
  const box=document.createElement('section');box.className='cms-studio';box.setAttribute('aria-label','Visuele contenteditor');
  const heading=document.createElement('h3');heading.textContent='Visuele contenteditor';
  const help=document.createElement('p');help.textContent='Bewerk de inhoud via gewone velden. De bestaande CMS-API bewaart versies en vereist afzonderlijke publicatiegoedkeuring.';
  const fields=document.createElement('div');fields.className='cms-studio-fields';
  const controls=document.createElement('div');controls.className='cms-studio-controls';
  const btn=document.createElement('button');btn.type='button';btn.className='btn ghost';btn.textContent='Toon concept op de pagina';btn.addEventListener('click',preview);controls.append(btn);
  const msg=document.createElement('div');msg.className='cms-studio-feedback';msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
  const advanced=document.createElement('details');advanced.className='cms-studio-advanced';
  const summary=document.createElement('summary');summary.textContent='Geavanceerd: oorspronkelijke JSON-bewerking';advanced.append(summary);advanced.append(originalLabel);
  box.append(heading,help,fields,controls,msg,advanced);
  editor.insertBefore(box,$('#cmsQuality'));
  studio.fields=fields;studio.feedback=msg;studio.preview=btn;studio.ready=true;
  const h=$('#cmsPowerhouseLoop');
  if(h){
    const dash=document.createElement('section');dash.className='cms-studio-dashboard';dash.setAttribute('aria-label','Redactionele status');
    const strong=document.createElement('strong');strong.textContent='Redactioneel overzicht · oorspronkelijke CMS/Heartbeat-data';
    const p=document.createElement('p');p.setAttribute('role','status');dash.append(strong,p);
    h.parentNode.insertBefore(dash,h.nextSibling);studio.dashboard=p;
    new MutationObserver(dashboard).observe(h,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['data-status']});dashboard();
  }
  $('#elementType')?.addEventListener('change',renderFields);
  $('#content')?.addEventListener('change',renderFields);
  $('#itemList')?.addEventListener('click',()=>queueMicrotask(renderFields));
  $('#clearBtn')?.addEventListener('click',()=>queueMicrotask(renderFields));
  $('#newItemBtn')?.addEventListener('click',()=>queueMicrotask(renderFields));
  ['surface','locale','route','area','elementKey','selector'].forEach(id=>$('#'+id)?.addEventListener('input',review));
  const title=$('#editorTitle');if(title)new MutationObserver(renderFields).observe(title,{childList:true,subtree:true,characterData:true});
  renderFields();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
