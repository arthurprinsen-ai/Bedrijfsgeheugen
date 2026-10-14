// Provider documentation probe: source reachability is NOT contract, price,
// model-availability or residency verification. Never modify verified_at.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const catalogPath=process.argv[2] || 'data/ai-model-catalog-v1.json';
const outPath=process.argv[3] || '.artifacts/ai-model-provider-source-audit.json';
const catalog=JSON.parse(await fs.readFile(catalogPath,'utf8'));
const providers=Object.freeze({
  OpenAI:['developers.openai.com','platform.openai.com','openai.com'],
  Anthropic:['anthropic.com','www.anthropic.com','docs.anthropic.com','platform.claude.com'],
  Google:['ai.google.dev','cloud.google.com'],
  'Mistral AI':['docs.mistral.ai','mistral.ai'],
  xAI:['docs.x.ai','x.ai'],
  DeepSeek:['api-docs.deepseek.com','deepseek.com'],
  Cohere:['docs.cohere.com','cohere.com'],
  Meta:['llama.com','www.llama.com','ai.meta.com'],
  'Alibaba/Qwen':['qwenlm.github.io','qwen.ai','www.qwen.ai'],
  Amazon:['docs.aws.amazon.com','aws.amazon.com'],
  'TII/Falcon':['huggingface.co','www.huggingface.co']
});
const unique=[...new Set(catalog.models.map(m=>m.source))];
const verdict=new Map();
const concurrency=4;
const maxSourceBytes=2_000_000;
const exactModelToken=(page,id)=>{
  const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\const concurrency=4;');
  return new RegExp('(^|[^a-zA-Z0-9_-])'+escaped+'(?=$|[^a-zA-Z0-9_-])','i').test(page);
};
let cursor=0;
async function worker(){
  while(cursor<unique.length){
    const url=unique[cursor++];
    const matching=catalog.models.filter(m=>m.source===url);
    const allowed=matching.every(m=>providers[m.provider]?.includes(new URL(url).hostname));
    if(!allowed){verdict.set(url,{state:'UNTRUSTED_SOURCE_DOMAIN',http_status:null});continue;}
    try{
      const response=await fetch(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(9000),
        headers:{'user-agent':'POWERHOUSE-catalog-source-audit/1.0'}});
      // A provider page mentioning a model ID is evidence of a mention only,
      // not of model availability, prices, governance, residency or a DPA.
      const body=await response.text();
      const bytes=Buffer.byteLength(body,'utf8');
      const readable=response.ok&&bytes<=maxSourceBytes;
      const mentions=readable?Object.fromEntries(matching.map(m=>[
        m.id,exactModelToken(body,m.id)
      ])):{};
      verdict.set(url,{state:!response.ok?'SOURCE_HTTP_ERROR':!readable?
        'SOURCE_TOO_LARGE_FOR_PROBE':'SOURCE_REACHABLE_NOT_CLAIM_VERIFIED',
        http_status:response.status,body_bytes:bytes,
        body_sha256:readable?createHash('sha256').update(body).digest('hex'):null,
        model_id_mentions:mentions});
    }catch(e){
      verdict.set(url,{state:'SOURCE_FETCH_ERROR',http_status:null,
        error:String(e?.name||'FETCH_FAILED').slice(0,80)});
    }
  }
}
await Promise.all(Array.from({length:concurrency},()=>worker()));
const receipts=catalog.models.map(m=>({
  model_id:m.id,provider:m.provider,source:m.source,source_probe:verdict.get(m.source),
  last_claim_verification:m.verified_at,
  model_id_mentioned_in_document:verdict.get(m.source)?.model_id_mentions?.[m.id]===true,
  provider_doc_identity_mention_only:true,
  claims_verified_by_this_probe:false,
  contract_dpa_verified:false,
  customer_runtime_residency_verified:false,
  pricing_verified_by_this_probe:false
}));
const audit={
  contract:'powerhouse-provider-source-probe-v1',created_at:new Date().toISOString(),
  checked_models:receipts.length,unique_sources:unique.length,
  source_reachable:receipts.filter(x=>x.source_probe?.state==='SOURCE_REACHABLE_NOT_CLAIM_VERIFIED').length,
  identity_mentions:receipts.filter(x=>x.model_id_mentioned_in_document).length,
  claim_verifications_added:0,
  note:'Reachability does not establish model availability, provider terms, residency, retention, pricing or customer contracts.',
  receipts
};
await fs.mkdir(path.dirname(outPath),{recursive:true});
await fs.writeFile(outPath,JSON.stringify(audit,null,2)+'\n');
process.stdout.write(JSON.stringify({output:outPath,checked_models:audit.checked_models,
  unique_sources:audit.unique_sources,source_reachable:audit.source_reachable,
  identity_mentions:audit.identity_mentions,
  claim_verifications_added:0})+'\n');
