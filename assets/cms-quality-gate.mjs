// Canonical CMS content-quality contract. Pure: no writes, no schedulers, no invented provider proof.
// The original Supabase cms_content_items + cms_content_revisions are the only content authority.
const STR=x=>typeof x==='string'?x.trim():'';
const TYPES=new Set(['text','html','link','image','meta','attribute','toggle','structured']);
const SURFACES=new Set(['website','portal','shared']);
const LOCALES=new Set(['nl-NL','en-US']);
const MAX_CONTENT=50000;
export function cmsSafeUrl(value,{link=false}={}){
 const v=STR(value);
 if(!v||v.length>2048||/[\u0000-\u001f\u007f\\]/.test(v)||v.startsWith('//'))return false;
 if(/^(?:\/|#|\?)(?!\/)/.test(v))return true;
 if(/^https:\/\/[a-z0-9.-]+(?::[0-9]{1,5})?(?:[/?#]|$)/i.test(v))return true;
 if(link&&/^(?:mailto:[^\s@]+@[^\s@]+\.[^\s@]+|tel:\+?[0-9() .-]{6,})$/i.test(v))return true;
 return false;
}
const add=(xs,cond,code)=>{if(cond)xs.push(code)};
export function cmsQuality(item={}){
 const errors=[],warnings=[];
 const c=item?.content&&typeof item.content==='object'&&!Array.isArray(item.content)?item.content:null;
 const type=STR(item?.element_type),area=STR(item?.area).toLowerCase(),key=STR(item?.element_key);
 const scope=STR(item?.surface),locale=STR(item?.locale),route=STR(item?.route);
 add(errors,!SURFACES.has(scope),'SURFACE_INVALID');
 add(errors,!LOCALES.has(locale),'LOCALE_INVALID');
 add(errors,!route||route.length>512||/[\u0000-\u001f<>]/.test(route)||(!route.startsWith('/')&&route!=='*'),'ROUTE_INVALID');
 add(errors,!key||key.length>180||!/^[a-z0-9][a-z0-9_.-]*$/i.test(key),'ELEMENT_KEY_INVALID');
 add(errors,!TYPES.has(type),'ELEMENT_TYPE_INVALID');
 add(errors,!c,'CONTENT_MISSING');
 let serialized='';try{serialized=JSON.stringify(c??{})}catch{errors.push('CONTENT_INVALID')}
 add(errors,serialized.length>MAX_CONTENT,'CONTENT_TOO_LARGE');
 const s=name=>STR(c?.[name]);
 if(c&&TYPES.has(type)){
  if(type==='text'){
   add(errors,!s('text'),'TEXT_EMPTY');
   add(warnings,s('text').length>240&&(!Array.isArray(c.source_refs)||!c.source_refs.length),'EDITORIAL_SOURCE_REFS_DUE');
  }
  if(type==='meta'){
   add(errors,!s('content'),'META_EMPTY');
   add(warnings,area==='seo'&&s('content').length>170,'SEO_META_LENGTH_REVIEW');
  }
  if(type==='link'){
   add(errors,!s('text'),'LINK_LABEL_EMPTY');
   add(errors,!cmsSafeUrl(c.href,{link:true}),'LINK_URL_UNSAFE');
   add(warnings,/^(?:klik hier|click here|meer|more)$/i.test(s('text')),'CTA_COPY_NOT_SPECIFIC');
  }
  if(type==='image'){
   add(errors,!cmsSafeUrl(c.src),'IMAGE_URL_UNSAFE');
   add(errors,!s('alt')&&c.decorative!==true,'IMAGE_ALT_REQUIRED');
  }
  if(type==='html'){
   add(errors,!s('html'),'HTML_EMPTY');
   add(errors,/<\s*\/?(?:script|iframe|object|embed|form|style|svg|math|meta|link)\b/i.test(s('html'))||
    /\bon[a-z]+\s*=/i.test(s('html'))||/(?:javascript|data|vbscript)\s*:/i.test(s('html')),'HTML_ACTIVE_CONTENT_FORBIDDEN');
   add(warnings,s('html').length>5000,'HTML_REVIEW_LONG');
  }
  if(type==='attribute'){
   const attrs=c.attributes;
   add(errors,!attrs||typeof attrs!=='object'||Array.isArray(attrs)||!Object.keys(attrs).length,'ATTRIBUTES_MISSING');
   if(attrs&&typeof attrs==='object'&&!Array.isArray(attrs)){
    for(const [name,v] of Object.entries(attrs)){
     add(errors,!/^[a-z_:][a-z0-9_:.-]*$/i.test(name)||/^on/i.test(name)||/^(?:style|srcdoc|formaction)$/i.test(name),'ATTRIBUTE_FORBIDDEN');
     if(/^(?:href|src|action|poster)$/i.test(name))add(errors,!cmsSafeUrl(v,{link:name==='href'}),'ATTRIBUTE_URL_UNSAFE');
    }
   }
  }
  if(type==='toggle')add(errors,typeof c.hidden!=='boolean','TOGGLE_HIDDEN_BOOLEAN_REQUIRED');
  if(type==='structured')add(errors,!Object.keys(c).length,'STRUCTURED_CONTENT_EMPTY');
 }
 const distinct=xs=>Object.freeze([...new Set(xs)]);
 const blocking=distinct(errors),advisory=distinct(warnings);
 return Object.freeze({
  contract:'cms-powerhouse-quality-v1',
  status:blocking.length?'BLOCKED':advisory.length?'REVIEW_WITH_WARNINGS':'READY_FOR_EDITOR_REVIEW',
  publishEligible:blocking.length===0,
  humanApprovalRequired:true,
  errors:blocking,warnings:advisory,
  sourceRef:item?.id&&Number.isInteger(Number(item.version))?`cms:item:${item.id}:v${item.version}`:null,
  providerReadbackVerified:false,revenueVerified:false
 });
}
export function cmsPowerhouseLoop(items,generatedAt){
 if(!Array.isArray(items)||!STR(generatedAt)||items.some(x=>!x||!SURFACES.has(x.surface)||!['draft','published','archived'].includes(x.status)))
  return Object.freeze({contract:'cms-powerhouse-loop-v1',status:'UNAVAILABLE',generatedAt:null,stages:Object.freeze([]),totals:null});
 const active=items.filter(x=>x.status!=='archived'),published=active.filter(x=>x.status==='published');
 const draft=active.filter(x=>x.status==='draft');
 const blocked=draft.filter(x=>!cmsQuality(x).publishEligible);
 const warnings=draft.filter(x=>cmsQuality(x).warnings.length>0);
 const stages=[
  {id:'source',status:'OBSERVED',evidence:'cms_content_items'},
  {id:'quality',status:blocked.length?'NEEDS_REPAIR':'EVALUATED',evidence:'cms-powerhouse-quality-v1'},
  {id:'human_approval',status:published.length?'PARTIAL':'EVIDENCE_DUE',evidence:'cms_content_revisions'},
  {id:'publication',status:published.length?'PARTIAL':'EVIDENCE_DUE',evidence:'cms_content_items.status'},
  {id:'public_readback',status:'EVIDENCE_DUE',evidence:null},
  {id:'visits_and_cta',status:'EVIDENCE_DUE',evidence:null},
  {id:'leads_and_orders',status:'EVIDENCE_DUE',evidence:null},
  {id:'verified_learning',status:'EVIDENCE_DUE',evidence:null}
 ];
 return Object.freeze({contract:'cms-powerhouse-loop-v1',
  status:blocked.length?'REPAIR_DUE':published.length?'OUTCOME_EVIDENCE_DUE':'PUBLICATION_EVIDENCE_DUE',
  generatedAt,
  totals:Object.freeze({items:items.length,draft:draft.length,published:published.length,
   archived:items.length-active.length,qualityBlocked:blocked.length,qualityWarnings:warnings.length}),
  stages:Object.freeze(stages.map(x=>Object.freeze(x))),allGreen:false
 });
}
