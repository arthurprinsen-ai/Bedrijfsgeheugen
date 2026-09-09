import { createHash } from 'node:crypto';
import { ingestPowerhouseEvent } from './_powerhouse-core-client.mjs';

const sha=v=>createHash('sha256').update(String(v??'')).digest('hex');
const SITE='https://www.bedrijfsgeheugen.nl';

export function parseSitemap(xml=''){
  const rows=[];
  for(const block of String(xml).matchAll(/<url>([\s\S]*?)<\/url>/gi)){
    const loc=block[1].match(/<loc>(.*?)<\/loc>/i)?.[1]?.trim()||'';
    const lastmod=block[1].match(/<lastmod>(.*?)<\/lastmod>/i)?.[1]?.trim()||null;
    if(!loc||(!loc.includes('/blog/')&&!loc.includes('/kennis/')))continue;
    rows.push({loc,lastmod});
  }
  return rows;
}

function slugTopic(url){try{const p=new URL(url).pathname.split('/').filter(Boolean);return p[p.length-1]||'content';}catch{return 'content';}}

export async function runContentObserver({fetchFn=globalThis.fetch,coreOptions={},site=SITE}={}){
  const response=await fetchFn(`${site.replace(/\/$/,'')}/sitemap.xml`,{headers:{accept:'application/xml,text/xml'},signal:AbortSignal.timeout(7000)});
  if(!response.ok)throw new Error(`SITEMAP_HTTP_${response.status}`);
  const rows=parseSitemap(await response.text());
  let ingested=0;
  for(const row of rows.slice(0,200)){
    const contentKey=`url:${sha(row.loc)}`;
    await ingestPowerhouseEvent({eventType:'blog_published',source:'website-sitemap',channel:'blog',dedupeKey:`content:${contentKey}:${row.lastmod||'current'}`,contentKey,topicKey:slugTopic(row.loc),canonicalUrl:row.loc,occurredAt:row.lastmod||new Date().toISOString(),dataQuality:'OBSERVED',confidence:0.9,evidence:{canonicalUrl:row.loc,lastmod:row.lastmod}}, {...coreOptions,fetchFn});
    ingested++;
  }
  return {ok:true,source:'sitemap',found:rows.length,ingested};
}

export default async function handler(input={}){
  const dependencyInjection=input&&typeof input==='object'&&!(input instanceof Request)&&('fetchFn' in input||'coreOptions' in input||'site' in input);
  try{return Response.json(await runContentObserver(dependencyInjection?input:{}),{status:200,headers:{'cache-control':'no-store'}});}catch(error){return Response.json({ok:false,state:'degraded',error:'POWERHOUSE_CONTENT_OBSERVER_FAILED',message:String(error?.message||error)},{status:503,headers:{'cache-control':'no-store'}});}
}

export const config={schedule:'50 5 * * *'};
