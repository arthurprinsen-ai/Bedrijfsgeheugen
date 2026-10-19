// Canonical GitHub-Actions-to-Supabase OpenAI translation. Never return API credentials.
// Authenticated GitHub OIDC only; production publishing remains offline and cache-only.
import {createRemoteJWKSet, jwtVerify} from 'npm:jose@6.1.0';

const AUDIENCE='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-openai-translation-gateway';
const ISSUER='https://token.actions.githubusercontent.com';
const REPOSITORY='arthurprinsen-ai/Bedrijfsgeheugen';
const REPOSITORY_ID='1303700955';
const WORKFLOW_REF=REPOSITORY+'/.github/workflows/powerhouse-daily-blog.yml@refs/heads/main';
const JWKS=createRemoteJWKSet(new URL(ISSUER+'/.well-known/jwks'));
const MAX_STRINGS=18;
const MAX_CHARS=3200;
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{'content-type':'application/json','cache-control':'no-store'}
});
const clean=(value:unknown)=>typeof value==='string'?value.trim():'';
const invariant=(value:string)=>({
  urls:[...value.matchAll(/https?:\/\/[^\s<>"']+/gi)].map(m=>m[0]).sort(),
  tokens:[...value.matchAll(/\{[a-zA-Z_][\w.-]*\}|\%\{[\w.-]+\}/g)].map(m=>m[0]).sort(),
});
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);

async function authenticate(request:Request){
  const header=request.headers.get('authorization')||'';
  if(!header.startsWith('Bearer '))throw new Error('AUTH_BEARER_REQUIRED');
  const token=header.slice(7).trim();
  if(!token||token.length>12000)throw new Error('AUTH_TOKEN_INVALID');
  const {payload}=await jwtVerify(token,JWKS,{
    issuer:ISSUER,audience:AUDIENCE,algorithms:['RS256'],
    clockTolerance:'10 seconds',
  });
  // Signature, audience, exact repository identity, protected-main workflow and
  // originating trigger must all agree. No anonymous or cross-repo provider proxy.
  if(payload.repository!==REPOSITORY ||
     String(payload.repository_id||'')!==REPOSITORY_ID ||
     payload.ref!=='refs/heads/main' ||
     payload.workflow_ref!==WORKFLOW_REF ||
     !['schedule','workflow_dispatch','push'].includes(String(payload.event_name||''))){
    throw new Error('AUTH_WORKFLOW_NOT_AUTHORIZED');
  }
}

async function providerKey(){
  const direct=clean(Deno.env.get('OPENAI_API_KEY'));
  if(direct)return direct;
  const url=clean(Deno.env.get('SUPABASE_URL'));
  const service=clean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  if(!url||!service)throw new Error('PROVIDER_SECRET_STORE_UNAVAILABLE');
  const r=await fetch(url+'/rest/v1/rpc/bg_geheim',{
    method:'POST',
    headers:{'apikey':service,'authorization':'Bearer '+service,'content-type':'application/json'},
    body:JSON.stringify({p_naam:'OPENAI_API_KEY'}),
    signal:AbortSignal.timeout(12000)
  });
  if(!r.ok)throw new Error('PROVIDER_SECRET_LOOKUP_FAILED');
  const value=await r.json();
  const key=clean(value);
  if(!key)throw new Error('OPENAI_CREDENTIAL_UNAVAILABLE');
  return key;
}

Deno.serve(async(request:Request)=>{
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  try{await authenticate(request)}
  catch{return json({ok:false,error:'UNAUTHORIZED'},401)}
  if(Number(request.headers.get('content-length')||0)>18000)
    return json({ok:false,error:'BATCH_TOO_LARGE'},413);
  let input:unknown;
  try{input=await request.json()}catch{return json({ok:false,error:'JSON_REQUIRED'},400)}
  if(!input||typeof input!=='object'||Array.isArray(input)||
     !Array.isArray((input as {strings?:unknown}).strings))
    return json({ok:false,error:'STRINGS_REQUIRED'},400);
  const strings=(input as {strings:unknown[]}).strings;
  if(strings.length<1||strings.length>MAX_STRINGS||
     strings.some(s=>typeof s!=='string'||!s.trim()||s.length>MAX_CHARS)||
     strings.reduce((n,s)=>n+(typeof s==='string'?s.length:0),0)>MAX_CHARS)
    return json({ok:false,error:'PUBLIC_TRANSLATION_BATCH_INVALID'},400);
  try{
    const key=await providerKey();
    const controller=AbortSignal.timeout(65000);
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{authorization:'Bearer '+key,'content-type':'application/json'},
      signal:controller,
      body:JSON.stringify({
        model:'gpt-5-mini',store:false,max_output_tokens:6000,
        instructions:'Translate public Dutch website and marketing strings into natural English. Preserve source meaning, exact URLs, placeholders, numbers and product names. Do not add claims. Return only the specified JSON object.',
        input:JSON.stringify(strings),
        text:{format:{
          type:'json_schema',name:'static_i18n_translations',strict:true,
          schema:{type:'object',properties:{
            translations:{type:'array',items:{type:'string'}}
          },required:['translations'],additionalProperties:false}
        }}
      })
    });
    if(!response.ok)return json({ok:false,error:'OPENAI_UPSTREAM_HTTP_'+response.status},502);
    const result=await response.json();
    if(result?.status!=='completed')throw new Error('OPENAI_INCOMPLETE');
    const raw=typeof result.output_text==='string'?result.output_text:
      (Array.isArray(result.output)?result.output.flatMap((p:any)=>
        Array.isArray(p.content)?p.content.filter((x:any)=>x.type==='output_text').map((x:any)=>x.text):[]
      ).join(''):'');
    const parsed=JSON.parse(raw);
    const translated=parsed?.translations;
    if(!Array.isArray(translated)||translated.length!==strings.length||
       translated.some((s:unknown)=>typeof s!=='string'||!s.trim()))
      throw new Error('TRANSLATION_RESPONSE_INVALID');
    for(let i=0;i<strings.length;i++){
      if(!same(invariant(strings[i] as string),invariant(translated[i])))
        throw new Error('IMMUTABLE_SOURCE_TOKEN_MISMATCH');
    }
    return json({ok:true,translations:translated});
  }catch{
    // Fail closed without logging any source copy, bearer token or API key.
    return json({ok:false,error:'APPROVED_OPENAI_TRANSLATION_FAILED'},502);
  }
});
