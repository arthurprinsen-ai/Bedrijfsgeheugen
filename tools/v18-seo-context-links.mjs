// SEO page-context links are rendered from the original V18 view source.
// In particular /systemen-koppelen.html is rebuilt from the homepage view,
// so edits to the old static HTML file alone never reach production.
const escapeText=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const localRoute=/^\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function renderViewSeoContextLinks(links=[]){
  if (!Array.isArray(links)) throw new Error('V18_SEO_CONTEXT_LINKS_NOT_ARRAY');
  if (!links.length) return '';
  if (links.length>3) throw new Error('V18_SEO_CONTEXT_LINKS_TOO_MANY');
  const seen=new Set();
  const anchors=links.map(({href,label})=>{
    if(typeof href!=='string'||!localRoute.test(href)) throw new Error('V18_SEO_CONTEXT_LINK_ROUTE_INVALID');
    if(typeof label!=='string'||label.trim().length<8||label.trim().length>100) throw new Error('V18_SEO_CONTEXT_LINK_LABEL_INVALID');
    if(seen.has(href)) throw new Error('V18_SEO_CONTEXT_LINK_DUPLICATE_ROUTE');
    seen.add(href);
    return '<a href="'+href+'">'+escapeText(label.trim())+'</a>';
  });
  return '<nav class="wrap v18-view-seo-context" aria-label="Gerelateerde systeemkoppelingen" style="padding-top:1rem;padding-bottom:.25rem"><p class="sub">'+anchors.join(' · ')+'</p></nav>';
}

export function assertViewSeoContextLinksRendered(html,links=[]){
  if(!Array.isArray(links)||!links.length)return true;
  const section=String(html).match(/<nav class="wrap v18-view-seo-context"[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  if(!section)throw new Error('V18_SEO_CONTEXT_LINK_NOT_IN_GENERATED_SITE');
  for(const {href,label} of links){
    if(!section.includes('<a href="'+href+'">'+escapeText(label.trim())+'</a>'))
      throw new Error('V18_SEO_CONTEXT_LINK_MISSING:'+href);
  }
  return true;
}
