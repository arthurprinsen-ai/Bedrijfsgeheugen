const MAX_IMAGE_BYTES = 1_500_000;
const UA = "BedrijfsgeheugenWorkshopScan/1.0";
function response(statusCode, body){return {statusCode,headers:{"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=86400"},body:JSON.stringify(body)}}
function siteUrl(raw){try{const u=new URL(raw);if(!["http:","https:"].includes(u.protocol))return null;if(["localhost","127.0.0.1","::1"].includes(u.hostname))return null;return u}catch{return null}}
function abs(base, value){try{return new URL(value,base).href}catch{return ""}}
function candidates(html, base){
  const found=[];
  const patterns=[
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/ig,
    /<link[^>]+rel=["'][^"']*(?:apple-touch-icon|icon)[^"']*["'][^>]+href=["']([^"']+)["']/ig,
    /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/ig,
    /<img[^>]+src=["']([^"']+)["'][^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["']/ig
  ];
  for(const re of patterns){let m;while((m=re.exec(html))&&found.length<12){const u=abs(base,m[1]);if(u&&!found.includes(u))found.push(u)}}
  for(const fallback of ["/favicon.svg","/favicon.png","/favicon.ico"]){const u=abs(base,fallback);if(!found.includes(u))found.push(u)}
  return found;
}
export async function handler(event){
  const site=siteUrl(event.queryStringParameters?.site||"");if(!site)return response(400,{ok:false});
  try{
    const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),4500);
    const page=await fetch(site.href,{redirect:"follow",signal:ctrl.signal,headers:{"user-agent":UA,"accept":"text/html,application/xhtml+xml"}});
    clearTimeout(timer);if(!page.ok)return response(404,{ok:false});
    const finalSite=siteUrl(page.url);if(!finalSite)return response(404,{ok:false});
    const html=(await page.text()).slice(0,500000);
    for(const src of candidates(html,finalSite.href)){
      try{
        const logoUrl=siteUrl(src);if(!logoUrl)continue;
        const img=await fetch(logoUrl.href,{redirect:"follow",headers:{"user-agent":UA,"accept":"image/*"}});
        if(!img.ok)continue;
        const type=(img.headers.get("content-type")||"").split(";")[0].toLowerCase();
        if(!type.startsWith("image/"))continue;
        const buf=Buffer.from(await img.arrayBuffer());if(!buf.length||buf.length>MAX_IMAGE_BYTES)continue;
        return response(200,{ok:true,logo_data_url:"data:"+type+";base64,"+buf.toString("base64"),source:new URL(img.url).origin});
      }catch{}
    }
    return response(404,{ok:false});
  }catch{return response(404,{ok:false})}
}
