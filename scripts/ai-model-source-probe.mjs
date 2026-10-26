#!/usr/bin/env node
// Availability probe ONLY. HTTP success never proves a model capability, privacy claim or currency.
import fs from 'node:fs';
import dns from 'node:dns/promises';
const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
const unique=[...new Set(catalog.models.map(m=>m.source).filter(Boolean))];
const blocked=(ip)=>/^(127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|fc|fd|fe80)/i.test(ip)||/^172\.(1[6-9]|2\d|3[01])\./.test(ip);
async function probe(raw){
 const item={url:raw,checked_at:new Date().toISOString(),status:'UNKNOWN',http_status:null};
 try{
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname==='localhost'||!u.hostname.includes('.'))throw Error('UNSAFE_URL');
  const addresses=await dns.lookup(u.hostname,{all:true});
  if(!addresses.length||addresses.some(a=>blocked(a.address)))throw Error('NON_PUBLIC_HOST');
  const response=await fetch(u,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(9000),headers:{'User-Agent':'Bedrijfsgeheugen-Evidence-Reachability/1.0'}});
  item.http_status=response.status;
  item.status=response.status>=200&&response.status<300?'REACHABLE':response.status>=300&&response.status<400?'REDIRECT_UNREVIEWED':'HTTP_ERROR';
  await response.body?.cancel();
 }catch(e){item.status='UNAVAILABLE';item.reason=String(e?.message||e).slice(0,180);}
 return item;
}
const results=[];
for(let i=0;i<unique.length;i+=4)results.push(...await Promise.all(unique.slice(i,i+4).map(probe)));
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/model-supplier-source-probe.json',JSON.stringify({generated_at:new Date().toISOString(),verification_type:'reachability_only_not_model_claim_verification',results},null,2)+'\n');
const summary=results.reduce((acc,r)=>(acc[r.status]=(acc[r.status]||0)+1,acc),{});
console.log(JSON.stringify({sources:results.length,summary},null,2));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n### Supplier link reachability (not verification)\n'+JSON.stringify(summary)+'\n');
