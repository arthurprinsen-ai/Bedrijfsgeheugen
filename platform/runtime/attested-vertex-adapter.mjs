import {AiRuntimeDenied} from '../brain/verified-ai-runtime.mjs';

const reject=reason=>{throw new AiRuntimeDenied(reason);};
const APPROVED_LOCATIONS=new Set(['europe-west1','europe-west4','europe-west9','us-central1']);
const validProject=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(x);
const validModel=x=>typeof x==='string'&&/^gemini-[a-zA-Z0-9.-]{1,100}$/.test(x);

// One trusted, region-pinned Google publisher-model transport. This is not a
// provider-residency attestation, credential issuer, or deployment operation.
export function createAttestedVertexAdapter({config,fetchFn}={}){
 if(!config||typeof fetchFn!=='function')reject('VERTEX_SERVER_CONFIG_REQUIRED');
 return async({route,request})=>{
  const c=config;
  const location=String(c.location??'');
  const region=String(route?.region??'');
  const regionMatches=(region==='EU'&&location.startsWith('europe-'))
    ||(region==='US'&&location==='us-central1');
  if(route?.provider!=='GOOGLE_VERTEX'||c.endpointId!==route.endpointId
    ||c.processingRegion!==region||c.modelId!==route.modelId
    ||!validProject(c.projectId)||!validModel(route.modelId)
    ||!APPROVED_LOCATIONS.has(location)||!regionMatches
    ||typeof c.accessToken!=='string'||!c.accessToken.trim()
    ||typeof c.providerReadbackEvidenceId!=='string'||!c.providerReadbackEvidenceId.trim()
    ||typeof c.egressEvidenceId!=='string'||!c.egressEvidenceId.trim())
   reject('VERTEX_RUNTIME_NOT_PROVISIONED');

  const systemText=request.messages.filter(m=>m.role==='system').map(m=>m.content).join('\n');
  const contents=request.messages.filter(m=>m.role!=='system')
   .map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
  if(contents.length===0)reject('VERTEX_USER_MESSAGE_REQUIRED');
  // Host and path are constructed from an explicit regional allowlist and
  // restricted server-side project/model identifiers, not from tenant input.
  const url='https://'+location+'-aiplatform.googleapis.com/v1/projects/'
   +c.projectId+'/locations/'+location+'/publishers/google/models/'
   +encodeURIComponent(route.modelId)+':generateContent';
  const response=await fetchFn(url,{
   method:'POST',redirect:'error',signal:AbortSignal.timeout(12_000),
   headers:{authorization:'Bearer '+c.accessToken,'content-type':'application/json'},
   body:JSON.stringify({
    contents,
    ...(systemText?{systemInstruction:{parts:[{text:systemText}]}}:{}),
    generationConfig:{maxOutputTokens:request.maxTokens,temperature:0}
   })
  });
  if(!response?.ok)reject('RUNTIME_PROVIDER_HTTP_GOOGLE_VERTEX_'+String(response?.status??'UNKNOWN'));
  const body=await response.json().catch(()=>null);
  const candidate=body?.candidates?.[0];
  if(candidate?.finishReason&&candidate.finishReason!=='STOP')
   reject('VERTEX_UNAPPROVED_FINISH_REASON');
  if(!Array.isArray(candidate?.content?.parts)||candidate.content.parts.some(x=>typeof x?.text!=='string'))
   reject('VERTEX_INVALID_RESPONSE');
  const text=candidate.content.parts.map(x=>x.text).join('\n').trim();
  if(!text)reject('VERTEX_EMPTY_RESPONSE');
  return Object.freeze({type:'Observation',text,confidence:0.5,
   containsRestrictedData:false,containsUnexpectedPII:false,providerUsage:body.usageMetadata??null});
 };
}
