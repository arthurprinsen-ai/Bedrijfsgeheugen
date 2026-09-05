import { injectSeoGraph } from './schema.mjs';
import { markPrimaryConversions, injectConversionTracker } from './conversion.mjs';
import { ORIGIN } from './registry.mjs';
import { enrichMoneyPage } from './money-contract-v2.mjs';

function attr(tag, name) {
  const m = String(tag || '').match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}
function stripTags(value) { return String(value || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function headOf(html) { return String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''; }
function bodyOf(html) { return String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || ''; }
function canonicalOf(html) { const tag=[...headOf(html).matchAll(/<link\b[^>]*>/gi)].find(m=>/(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0],'rel')))?.[0]||''; return attr(tag,'href'); }
function titleOf(html) { return stripTags(headOf(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''); }
function descriptionOf(html) { const tag=[...headOf(html).matchAll(/<meta\b[^>]*>/gi)].find(m=>/^description$/i.test(attr(m[0],'name')))?.[0]||''; return attr(tag,'content'); }
function visibleBreadcrumbContainer(html){ const body=bodyOf(html); return body.match(/<nav\b[^>]*aria-label=(?:"Kruimelpad"|'Kruimelpad')[^>]*>[\s\S]*?<\/nav>/i)?.[0]||body.match(/<(?:nav|ol)\b[^>]*class=(?:"[^"]*\bbgkruim\b[^"]*"|'[^']*\bbgkruim\b[^']*')[^>]*>[\s\S]*?<\/(?:nav|ol)>/i)?.[0]||''; }
function breadcrumbItems(html,canonical,title){ const container=visibleBreadcrumbContainer(html); if(!container) return canonical===`${ORIGIN}/`?[{name:'Home',url:`${ORIGIN}/`}]:[]; const items=[]; for(const m of container.matchAll(/<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi)){const url=m[1]??m[2]??'';const name=stripTags(m[3]);if(url.startsWith(`${ORIGIN}/`)&&name)items.push({name,url:url.split('#')[0].split('?')[0]});} const lastText=stripTags(container.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi,' ')); if(canonical&&canonical!==`${ORIGIN}/`&&!items.some(i=>i.url===canonical))items.push({name:lastText||title||'Pagina',url:canonical}); return items; }
export function inferSeoMeta(html){const canonical=canonicalOf(html);const title=titleOf(html);const description=descriptionOf(html);return {canonical,title,description,breadcrumbs:breadcrumbItems(html,canonical,title)};}

function markPageContext(input,entry){ const html=String(input); if(!/<body\b/i.test(html))return html; return html.replace(/<body\b([^>]*)>/i,(_tag,attrs)=>{const clean=attrs.replace(/\sdata-bg-page-role=(?:"[^"]*"|'[^']*')/gi,'').replace(/\sdata-bg-funnel-stage=(?:"[^"]*"|'[^']*')/gi,'').replace(/\sdata-bg-intent=(?:"[^"]*"|'[^']*')/gi,'').replace(/\sdata-bg-keyword-cluster=(?:"[^"]*"|'[^']*')/gi,'').replace(/\sdata-bg-intent-role=(?:"[^"]*"|'[^']*')/gi,'').replace(/\sdata-bg-intent-owner=(?:"[^"]*"|'[^']*')/gi,''); return `<body${clean} data-bg-page-role="${entry.role}" data-bg-funnel-stage="${entry.funnel_stage}" data-bg-intent="${entry.primary_intent}" data-bg-keyword-cluster="${entry.primary_keyword}" data-bg-intent-role="primary" data-bg-intent-owner="${entry.route}">`; }); }
function ensureMeta(input,name,value){let html=String(input);const re=new RegExp(`<meta\\b[^>]*name=(?:"${name}"|'${name}')[^>]*>`,'i');const tag=`<meta name="${name}" content="${String(value||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">`;return re.test(html)?html.replace(re,tag):html.replace(/<\/head>/i,`${tag}\n</head>`);}

export function enrichRegisteredPage(input,entry){
  let html=String(input); if(!entry?.route)return html;
  const meta=inferSeoMeta(html); if(meta.canonical!==entry.route)throw new Error(`Registry route ${entry.route} past niet op canonical ${meta.canonical||'(leeg)'}`);
  html=markPageContext(html,entry);
  html=ensureMeta(html,'bg-intent',entry.primary_intent);
  html=ensureMeta(html,'bg-keyword-cluster',entry.primary_keyword);
  html=ensureMeta(html,'bg-intent-owner',entry.route);
  html=enrichMoneyPage(html,entry);
  html=markPrimaryConversions(html,entry);
  html=injectConversionTracker(html);
  html=injectSeoGraph(html,{...meta,schema_type:entry.schema_type});
  return html;
}
