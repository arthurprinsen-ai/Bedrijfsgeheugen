(function(){
'use strict';
var items=[],selected=null,activeArea='',picking=false;
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return [...(r||document).querySelectorAll(s)]};
function on(s,event,handler){var el=$(s);if(el)el.addEventListener(event,handler);return el}
function toast(msg){var old=$('.toast');if(old)old.remove();var d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(function(){d.remove()},2600)}
function user(){try{return window.netlifyIdentity?.currentUser?.()||null}catch{return null}}
async function headers(){var u=user();if(!u)return{};try{var t=await u.jwt();return t?{authorization:'Bearer '+t}:{}}catch{return{}}}
function statusClass(s){return ['published','archived'].includes(s)?s:'draft'}
function normalizeRoute(v){v=String(v||'*').trim();return v||'*'}
function currentDraft(){
  var raw=$('#content').value.trim()||'{}',content;
  try{content=JSON.parse(raw)}catch{throw new Error('Content JSON is niet geldig.')}
  return {
    id:selected?.id,
    surface:$('#surface').value,locale:$('#locale').value,route:normalizeRoute($('#route').value),
    area:$('#area').value.trim()||'content',element_key:$('#elementKey').value.trim(),
    element_type:$('#elementType').value,selector:$('#selector').value.trim()||null,
    content:content,sort_order:Number($('#sortOrder').value||0),status:'draft'
  };
}
async function apiList(){
  var h=await headers();if(!h.authorization)throw new Error('Niet ingelogd');
  var r=await fetch('/api/cms-admin',{headers:{accept:'application/json',...h},credentials:'same-origin'});
  var d=await r.json().catch(function(){return{}});
  if(!r.ok)throw new Error(d.error||'Laden mislukt');
  items=Array.isArray(d.items)?d.items:[];
  renderList();
}
async function mutate(body){
  var h=await headers();if(!h.authorization)throw new Error('Niet ingelogd');
  var r=await fetch('/api/cms-admin',{method:'POST',headers:{'content-type':'application/json',...h},credentials:'same-origin',body:JSON.stringify(body)});
  var d=await r.json().catch(function(){return{}});
  if(!r.ok)throw new Error(d.error||'Opslaan mislukt');
  return d;
}
function filtered(){
  var sf=$('#surfaceFilter').value,lc=$('#localeFilter').value,st=$('#statusFilter').value,q=$('#searchFilter').value.trim().toLowerCase();
  return items.filter(function(x){
    if(sf&&x.surface!==sf)return false;if(lc&&x.locale!==lc)return false;if(st&&x.status!==st)return false;if(activeArea&&x.area!==activeArea)return false;
    if(q&&!([x.route,x.area,x.element_key,x.selector,x.element_type,JSON.stringify(x.content)].join(' ').toLowerCase().includes(q)))return false;
    return true;
  });
}
function renderList(){
  var rows=filtered();$('#countLabel').textContent=rows.length+' elementen';
  $('#itemList').innerHTML=rows.length?rows.map(function(x){
    return '<div class="row '+(selected?.id===x.id?'active':'')+'" data-id="'+x.id+'"><div><strong>'+escapeHtml(x.element_key)+'</strong><div class="meta">'+escapeHtml(x.surface)+' · '+escapeHtml(x.locale)+' · '+escapeHtml(x.route)+' · '+escapeHtml(x.area)+'<br>'+escapeHtml(x.selector||'gestructureerd element')+'</div></div><span class="status '+statusClass(x.status)+'">'+escapeHtml(x.status)+'</span></div>';
  }).join(''):'<div class="row"><div><strong>Geen elementen gevonden</strong><div class="meta">Pas filters aan of voeg een element toe.</div></div></div>';
  $$('.row[data-id]').forEach(function(r){r.addEventListener('click',function(){selectItem(items.find(function(x){return x.id===r.dataset.id}))})});
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})}
function selectItem(x){
  selected=x||null;
  $('#surface').value=x?.surface||'website';$('#locale').value=x?.locale||'nl-NL';$('#route').value=x?.route||'/';$('#area').value=x?.area||'content';
  $('#elementKey').value=x?.element_key||'';$('#elementType').value=x?.element_type||'text';$('#selector').value=x?.selector||'';$('#sortOrder').value=x?.sort_order||0;
  $('#content').value=JSON.stringify(x?.content||{},null,2);$('#editorTitle').textContent=x?.element_key||'Nieuw element';
  var s=x?.status||'draft';$('#editorStatus').className='status '+statusClass(s);$('#editorStatus').textContent=s;
  $('#publishBtn').disabled=!x?.id;$('#archiveBtn').disabled=!x?.id;renderList();
}
function uniqueSelector(el,doc){
  if(el.id)return '#'+CSS.escape(el.id);
  var cms=el.getAttribute('data-cms-key')||el.getAttribute('data-bg-cms-key');
  if(cms)return '[data-bg-cms-key="'+CSS.escape(cms)+'"]';
  var parts=[],node=el;
  while(node&&node.nodeType===1&&node!==doc.body){
    var tag=node.tagName.toLowerCase();
    var cls=[...node.classList].filter(function(x){return !/^is-|^active$|^open$/.test(x)}).slice(0,2);
    var part=tag+(cls.length?'.'+cls.map(CSS.escape).join('.'):'');
    var parent=node.parentElement;
    if(parent){
      var siblings=[...parent.children].filter(function(s){return s.tagName===node.tagName});
      if(siblings.length>1)part+=':nth-of-type('+(siblings.indexOf(node)+1)+')';
    }
    parts.unshift(part);
    try{if(doc.querySelectorAll(parts.join(' > ')).length===1)break}catch{}
    node=parent;
  }
  return parts.join(' > ');
}
function infer(el){
  var tag=el.tagName.toLowerCase(),type='text',content={text:(el.textContent||'').trim()};
  if(tag==='a'){type='link';content={text:(el.textContent||'').trim(),href:el.getAttribute('href')||''}}
  else if(tag==='img'){type='image';content={src:el.getAttribute('src')||'',alt:el.getAttribute('alt')||''}}
  else if(tag==='meta'){type='meta';content={content:el.getAttribute('content')||''}}
  else if(['section','article','div','ul','ol'].includes(tag)&&el.children.length>2){type='html';content={html:el.innerHTML}}
  return {type:type,content:content};
}
function pageRouteFromFrame(frame){
  try{
    var u=new URL(frame.contentWindow.location.href);
    var p=u.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';
    if(p.startsWith('/portal')&&u.hash)p+=u.hash;
    return p;
  }catch{return '/'}
}
function startPick(){
  var frame=$('#previewFrame'),doc;
  try{doc=frame.contentDocument}catch{}
  if(!doc){toast('Preview is niet toegankelijk.');return}
  picking=true;$('#pickbar').classList.add('on');
  function move(e){if(!picking)return;doc.querySelectorAll('[data-cms-picker-hover]').forEach(function(n){n.removeAttribute('data-cms-picker-hover');n.style.outline=''});var t=e.target;if(t&&t.style){t.setAttribute('data-cms-picker-hover','1');t.style.outline='2px solid #ff4f17'}}
  function click(e){
    if(!picking)return;e.preventDefault();e.stopPropagation();picking=false;$('#pickbar').classList.remove('on');
    var el=e.target;el.style.outline='';el.removeAttribute('data-cms-picker-hover');
    var sel=uniqueSelector(el,doc),inf=infer(el),r=pageRouteFromFrame(frame);
    selectItem(null);$('#surface').value=r.startsWith('/portal')?'portal':'website';$('#route').value=r;$('#selector').value=sel;$('#elementType').value=inf.type;$('#content').value=JSON.stringify(inf.content,null,2);
    var key=(r==='/'?'home':r.replace(/^\//,'').replace(/[^a-z0-9]+/gi,'.').replace(/^\.|\.$/g,''))+'.'+el.tagName.toLowerCase()+'.'+Math.random().toString(36).slice(2,7);
    $('#elementKey').value=(r.startsWith('/portal')?'portal.':'website.')+key;$('#editorTitle').textContent='Nieuw element';toast('Element geselecteerd. Geef het een duidelijke sleutel en sla het op.');
    doc.removeEventListener('mouseover',move,true);doc.removeEventListener('click',click,true);
  }
  doc.addEventListener('mouseover',move,true);doc.addEventListener('click',click,true);
}
async function save(e){
  if(e)e.preventDefault();
  try{
    var item=currentDraft();if(!item.element_key)throw new Error('Unieke sleutel is verplicht.');
    var d=await mutate({action:'save',item:item});selected=d.item;toast('Draft opgeslagen');await apiList();selectItem(items.find(function(x){return x.id===selected.id})||selected);
  }catch(err){toast(err.message||String(err))}
}
async function changeStatus(action){
  if(!selected?.id)return;
  try{var d=await mutate({action:action,id:selected.id});selected=d.item;toast(action==='publish'?'Gepubliceerd':'Gearchiveerd');await apiList();selectItem(items.find(function(x){return x.id===selected.id})||selected);if(action==='publish'&&window.BGCMS)window.BGCMS.reload()}
  catch(err){toast(err.message||String(err))}
}
function bind(){
  on('#loginBtn','click',function(){window.netlifyIdentity?.open?.()});on('#logoutBtn','click',function(){window.netlifyIdentity?.logout?.()});
  on('#refreshBtn','click',function(){apiList().catch(function(e){toast(e.message)})});on('#editor','submit',save);on('#publishBtn','click',function(){changeStatus('publish')});on('#archiveBtn','click',function(){changeStatus('archive')});
  on('#clearBtn','click',function(){selectItem(null)});on('#newItemBtn','click',function(){selectItem(null);window.scrollTo({top:0,behavior:'smooth'})});
  ['surfaceFilter','localeFilter','statusFilter','searchFilter'].forEach(function(id){on('#'+id,id==='searchFilter'?'input':'change',renderList)});
  $('[data-area]').forEach(function(b){b.addEventListener('click',function(){$('[data-area]').forEach(function(x){x.classList.remove('active')});b.classList.add('active');activeArea=b.dataset.area||'';renderList()})});
  on('#loadPreviewBtn','click',function(){var input=$('#previewUrl'),frame=$('#previewFrame');var raw=input?input.value.trim()||'/':'/';try{var u=new URL(raw,location.origin);if(u.origin!==location.origin||!['http:','https:'].includes(u.protocol))throw new Error('Alleen pagina’s op bedrijfsgeheugen.nl zijn toegestaan.');if(frame?.contentWindow)frame.contentWindow.location.replace(u.pathname+u.search+u.hash)}catch(e){toast(e.message||'Ongeldige previewroute')}});on('#pickBtn','click',startPick);
}
async function enter(u){
  if(!u){$('#authGate').classList.remove('hidden');$('#app').classList.add('hidden');return}
  $('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');$('#userLabel').textContent=u.email||u.id;
  try{await apiList();selectItem(null)}catch(e){toast(e.message||String(e))}
}
function boot(){
  bind();
  if(!window.netlifyIdentity){toast('Identity is niet beschikbaar.');return}
  window.netlifyIdentity.on('init',enter);window.netlifyIdentity.on('login',function(u){window.netlifyIdentity.close();enter(u)});window.netlifyIdentity.on('logout',function(){enter(null)});
  var u=user();if(u)enter(u);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();