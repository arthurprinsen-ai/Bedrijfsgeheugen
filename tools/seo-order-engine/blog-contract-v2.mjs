import { enrichBlog as enrichBlogV1, inspectBlog as inspectBlogV1, dominantCommercialEntry } from './blog-contract.mjs';
import { ORIGIN } from './registry.mjs';

function headOf(html){return String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';}
function bodyOf(html){return String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]||'';}
function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function ensureMeta(input,name,value){let html=String(input);const re=new RegExp(`<meta\\b[^>]*name=(?:"${name}"|'${name}')[^>]*>`,'i');const tag=`<meta name="${name}" content="${esc(value)}">`;return re.test(html)?html.replace(re,tag):html.replace(/<\/head>/i,`${tag}\n</head>`);}
function absolutizeArticle(input){let html=String(input);const target=html.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)||html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i);if(!target)return html;const fixed=target[0].replace(/href=(['"])\/(?!\/)([^'"]*)\1/gi,(_m,q,p)=>`href=${q}${ORIGIN}/${p}${q}`);return html.replace(target[0],fixed);}
function markBody(input,commercial){const html=String(input);if(!/<body\b/i.test(html))return html;const intent=commercial?.primary_intent||'digitalisering mkb';const keyword=commercial?.primary_keyword||'digitalisering mkb';return html.replace(/<body\b([^>]*)>/i,(_tag,attrs)=>{const clean=attrs.replace(/\sdata-bg-page-role=(?:"[^"]*"|'[^']*')/gi,'').replace(/\sdata-bg-funnel-stage=(?:"[^"]*"|'[^']*')/gi,'').replace(/\sdata-bg-intent=(?:"[^"]*"|'[^']*')/gi,'').replace(/\sdata-bg-keyword-cluster=(?:"[^"]*"|'[^']*')/gi,'');return `<body${clean} data-bg-page-role="article" data-bg-funnel-stage="discover" data-bg-intent="${esc(intent)}" data-bg-keyword-cluster="${esc(keyword)}">`;});}

export function enrichBlog(input,path,registry){
  let html=enrichBlogV1(input,path,registry);
  const commercial=dominantCommercialEntry(html,registry);
  html=absolutizeArticle(html);
  html=markBody(html,commercial);
  html=ensureMeta(html,'bg-order-contract','v2');
  html=ensureMeta(html,'bg-intent',commercial?.primary_intent||'digitalisering mkb');
  html=ensureMeta(html,'bg-keyword-cluster',commercial?.primary_keyword||'digitalisering mkb');
  return html;
}

export function inspectBlog(input,path,registry){
  const html=String(input);const errors=inspectBlogV1(html,path,registry).filter(e=>!e.includes('bg-order-contract v1'));
  const commercial=dominantCommercialEntry(html,registry);
  if(!/<meta\b[^>]*name=(?:"bg-order-contract"|'bg-order-contract')[^>]*content=(?:"v2"|'v2')[^>]*>/i.test(headOf(html)))errors.push(`${path}: bg-order-contract v2 ontbreekt`);
  if(!/<meta\b[^>]*name=(?:"bg-intent"|'bg-intent')[^>]*content=/i.test(headOf(html)))errors.push(`${path}: intent marker ontbreekt`);
  if(!/<meta\b[^>]*name=(?:"bg-keyword-cluster"|'bg-keyword-cluster')[^>]*content=/i.test(headOf(html)))errors.push(`${path}: keyword-cluster marker ontbreekt`);
  if(!/data-bg-page-role=["']article["']/i.test(bodyOf(html)))errors.push(`${path}: article page-role ontbreekt`);
  if(commercial&&!(html.includes(`href="${commercial.route}"`)||html.includes(`href='${commercial.route}'`)))errors.push(`${path}: dominante commerciële route ontbreekt`);
  if(/href=(?:"\/(?!\/)|'\/(?!\/))/i.test(bodyOf(html)))errors.push(`${path}: root-relative interne link in body`);
  return [...new Set(errors)];
}
