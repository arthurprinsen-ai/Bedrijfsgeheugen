import {createHash,createHmac} from 'node:crypto';
import {AiRuntimeDenied} from '../brain/verified-ai-runtime.mjs';

// AWS regional Converse API only. Cross-region/global inference profiles are
// deliberately excluded until independent provider readback proves residency.
const REGIONS=Object.freeze({'eu-central-1':'EU','eu-west-1':'EU','us-east-1':'US'});
const reject=reason=>{throw new AiRuntimeDenied(reason)};
const hash=data=>createHash('sha256').update(data,'utf8').digest('hex');
const hmac=(key,data)=>createHmac('sha256',key).update(data,'utf8').digest();
const validModel=id=>typeof id==='string'
 && /^(anthropic|amazon|mistral)\.[a-zA-Z0-9._-]{2,100}:[0-9]{1,3}$/.test(id);
const validEvidence=x=>typeof x==='string'&&x.length>=6&&x.length<=256;

export function createAttestedBedrockAdapter({config,fetchFn,now=Date.now()}={}){
 if(!config||typeof config!=='object'||typeof fetchFn!=='function')reject('BEDROCK_SERVER_CONFIG_REQUIRED');
 return async({route,request})=>{
  const c=config,region=c.awsRegion;
  if(route?.provider!=='AWS_BEDROCK'||route.networkMode!=='STANDARD'
    ||c.endpointId!==route.endpointId||c.modelId!==route.modelId
    ||!validModel(route.modelId)||REGIONS[region]!==route.region
    ||c.processingRegion!==route.region||c.modelReadbackRegion!==region
    ||!validEvidence(c.providerReadbackEvidenceId)||!validEvidence(c.egressEvidenceId)
    ||!validEvidence(c.residencyEvidenceId))
   reject('BEDROCK_RUNTIME_NOT_PROVISIONED');
  // Only an explicitly issued short-lived STS role session, never browser-
  // supplied credentials or long-lived access keys, may sign the request.
  if(typeof c.accessKeyId!=='string'||!/^ASIA[A-Z0-9]{16}$/.test(c.accessKeyId)
    ||typeof c.secretAccessKey!=='string'||c.secretAccessKey.length<32
    ||typeof c.sessionToken!=='string'||c.sessionToken.length<16
    ||!Number.isSafeInteger(c.credentialsExpireAt)||c.credentialsExpireAt<=now+12_000)
   reject('BEDROCK_SESSION_NOT_VERIFIED');
  const systems=request.messages.filter(m=>m.role==='system').map(m=>({text:m.content}));
  const messages=request.messages.filter(m=>m.role!=='system').map(m=>({
   role:m.role,content:[{text:m.content}]
  }));
  if(!messages.length||!messages.some(m=>m.role==='user'))
   reject('BEDROCK_USER_MESSAGE_REQUIRED');
  const payload=JSON.stringify({messages,...(systems.length?{system:systems}:{}),
   inferenceConfig:{maxTokens:request.maxTokens,temperature:0}});
  const host='bedrock-runtime.'+region+'.amazonaws.com';
  const uri='/model/'+encodeURIComponent(route.modelId)+'/converse';
  const amzDate=new Date(now).toISOString().replace(/[:-]|\.\d{3}/g,'');
  const date=amzDate.slice(0,8);
  const payloadHash=hash(payload);
  const headers={
   'content-type':'application/json',
   host,
   'x-amz-content-sha256':payloadHash,
   'x-amz-date':amzDate,
   'x-amz-security-token':c.sessionToken
  };
  const keys=Object.keys(headers).sort();
  const canonical=keys.map(k=>k+':'+headers[k].trim()+'\n').join('');
  const signedHeaders=keys.join(';');
  const canonicalRequest=['POST',uri,'',canonical,signedHeaders,payloadHash].join('\n');
  const scope=date+'/'+region+'/bedrock/aws4_request';
  const stringToSign=['AWS4-HMAC-SHA256',amzDate,scope,hash(canonicalRequest)].join('\n');
  const key=hmac(hmac(hmac(hmac('AWS4'+c.secretAccessKey,date),region),'bedrock'),'aws4_request');
  const signature=createHmac('sha256',key).update(stringToSign).digest('hex');
  const authorization='AWS4-HMAC-SHA256 Credential='+c.accessKeyId+'/'+scope+
   ', SignedHeaders='+signedHeaders+', Signature='+signature;
  // Neither host nor path can be configured by tenant. One request; no retries,
  // redirects, global endpoint, private/cloud fallback or model substitution.
  let response;
  try{response=await fetchFn('https://'+host+uri,{
   method:'POST',redirect:'error',signal:AbortSignal.timeout(12_000),
   headers:{...headers,authorization},body:payload
  });}catch{reject('BEDROCK_TRANSPORT_FAILED');}
  if(!response?.ok)reject('RUNTIME_PROVIDER_HTTP_AWS_BEDROCK_'+String(response?.status??'UNKNOWN'));
  const body=await response.json().catch(()=>null);
  const parts=body?.output?.message?.content;
  if(body?.stopReason!=='end_turn'||body?.output?.message?.role!=='assistant'
    ||!Array.isArray(parts)||!parts.length
    ||parts.some(part=>typeof part?.text!=='string'))
   reject('BEDROCK_UNAPPROVED_RESPONSE');
  const text=parts.map(part=>part.text).join('\n').trim();
  if(!text)reject('BEDROCK_EMPTY_RESPONSE');
  return Object.freeze({type:'Observation',text,confidence:0.5,
   containsRestrictedData:false,containsUnexpectedPII:false,
   providerUsage:body.usage??null});
 };
}
