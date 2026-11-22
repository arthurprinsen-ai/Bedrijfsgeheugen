// Real, bounded AFAS Profit REST GetConnector adapter for the ORIGINAL Connector
// Studio. No arbitrary URLs, redirects, mutation, simulated test data or token
// persistence in the browser. This adapter only fetches authorized live records.
import {createHash} from 'node:crypto';

const FIELD=/^[\p{L}_][\p{L}\p{N}_-]{0,79}$/u;
const BLOCKED_FIELD=/(^|[_-])(bsn|sofinummer|paspoort|passport|password|wachtwoord|secret|api.?key|token|access.?key|diagnose|health|gezondheid)([_-]|$)/i;
const PERSONAL_FIELD=/(email|e.mail|telefoon|phone|voornaam|achternaam|klantnaam|customername|geboortedatum|address|adres|iban|salaris|salary)/i;
const ROW_LIMIT=100,FIELD_LIMIT=40,BODY_LIMIT=260_000,VALUE_LIMIT=2000;
export const AFAS_LIVE_LIMITS=Object.freeze({rows:ROW_LIMIT,fields:FIELD_LIMIT,bodyBytes:BODY_LIMIT});
const failure=(code,status=422)=>Object.assign(new Error(code),{code,status});
export function validateAfasSource(source){
 if(source?.type!=='afas')throw failure('AFAS_SOURCE_REQUIRED');
 const environment=String(source.environment||'').trim();
 const connector=String(source.getConnector||'').trim();
 if(!/^\d{3,8}$/.test(environment))throw failure('INVALID_AFAS_ENVIRONMENT');
 if(!/^[\p{L}\p{N}_-]{1,80}$/u.test(connector))throw failure('INVALID_GET_CONNECTOR');
 return Object.freeze({environment,getConnector:connector,
   url:'https://'+environment+'.rest.afas.online/ProfitRestServices/connectors/'+encodeURIComponent(connector)+'?skip=0&take='+ROW_LIMIT});
}
export function afasAuthHeader(raw){
 const token=String(raw||'').trim();
 if(token.length<35||token.length>5000)throw failure('INVALID_AFAS_CREDENTIAL');
 if(/^<token(?:\s[^>]*)?>[\s\S]+<\/token>$/i.test(token)){
  return 'AfasToken '+Buffer.from(token,'utf8').toString('base64');
 }
 if(/^[a-z0-9+/]+={0,2}$/i.test(token)){
  const decoded=Buffer.from(token,'base64').toString('utf8');
  if(/^<token(?:\s[^>]*)?>[\s\S]+<\/token>$/i.test(decoded))return 'AfasToken '+token;
 }
 throw failure('AFAS_TOKEN_XML_REQUIRED');
}
async function boundedBody(response){
 if(Number(response.headers.get('content-length')||0)>BODY_LIMIT)throw failure('AFAS_RESPONSE_TOO_LARGE',413);
 const reader=response.body?.getReader();
 if(!reader)throw failure('AFAS_EMPTY_RESPONSE',502);
 let total=0;const pieces=[];
 try{
  while(true){
   const {value,done}=await reader.read();if(done)break;
   total+=value.byteLength;
   if(total>BODY_LIMIT)throw failure('AFAS_RESPONSE_TOO_LARGE',413);
   pieces.push(value);
  }
 }finally{await reader.cancel().catch(()=>{});}
 return Buffer.concat(pieces.map(piece=>Buffer.from(piece))).toString('utf8');
}
function normalizedCell(value){
 if(value===null||value===undefined)return null;
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 if(typeof value==='boolean')return value;
 if(typeof value==='string')return value.slice(0,VALUE_LIMIT);
 return null; // reject complex source structures from tabular context.
}
export async function readAfasGetConnector({source,credential,fetchFn=globalThis.fetch,selectedFields=null,personalAuthorized=false}={}){
 const verified=validateAfasSource(source);
 const header=afasAuthHeader(credential); // NEVER emit, log, or persist the header.
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),12000);
 let response;
 try{
  response=await fetchFn(verified.url,{
    method:'GET',redirect:'error',signal:controller.signal,
    headers:{authorization:header,accept:'application/json'}
  });
  if(!response?.ok){
    if([401,403].includes(response?.status))throw failure('AFAS_PROVIDER_AUTH_REQUIRED',401);
    if(response?.status===429)throw failure('AFAS_RATE_LIMITED',429);
    throw failure('AFAS_PROVIDER_REQUEST_FAILED',502);
  }
  const body=await boundedBody(response);
  let json;
  try{json=JSON.parse(body);}catch{throw failure('AFAS_INVALID_JSON',502);}
  if(!Array.isArray(json?.rows))throw failure('AFAS_ROWS_NOT_RETURNED',502);
  const rawRows=json.rows.slice(0,ROW_LIMIT);
  if(!rawRows.length)throw failure('AFAS_NO_ROWS_TO_VERIFY',409);
  if(rawRows.some(row=>!row||typeof row!=='object'||Array.isArray(row)))throw failure('AFAS_INVALID_ROW_SHAPE',502);
  const discovered=[...new Set(rawRows.flatMap(row=>Object.keys(row)))].filter(key=>FIELD.test(key));
  if(!discovered.length)throw failure('AFAS_NO_SUPPORTED_COLUMNS',422);
  const available=discovered.slice(0,FIELD_LIMIT);
  const wanted=Array.isArray(selectedFields)?selectedFields:available;
  if(wanted.length>FIELD_LIMIT||new Set(wanted).size!==wanted.length
      ||wanted.some(key=>!FIELD.test(key)||!available.includes(key)))throw failure('AFAS_FIELD_SELECTION_INVALID');
  if(wanted.some(key=>BLOCKED_FIELD.test(key)))throw failure('AFAS_RESTRICTED_FIELDS_BLOCKED',403);
  if(!personalAuthorized&&wanted.some(key=>PERSONAL_FIELD.test(key)))
    throw failure('AFAS_PERSONAL_FIELDS_NEED_CONSENT',403);
  const fields=wanted.length?wanted:available;
  const rows=rawRows.map(row=>fields.map(key=>normalizedCell(row[key])));
  const digest=createHash('sha256').update(JSON.stringify({fields,rows})).digest('hex');
  return Object.freeze({
    provider:'afas',getConnector:verified.getConnector,environment:verified.environment,
    fields,rows,recordCount:rows.length,
    sourceHash:digest,proofLevel:'PROVIDER_VERIFIED',sourceReadSuccess:true,
    capturedAt:new Date().toISOString(),truncated:json.rows.length>ROW_LIMIT
  });
 }catch(error){
  if(error?.name==='AbortError')throw failure('AFAS_TIMEOUT',504);
  if(error?.code)throw error;
  throw failure('AFAS_PROVIDER_UNAVAILABLE',502);
 }finally{clearTimeout(timeout);}
}
export function afasSafeProbe(result,{selectedFields=[]}={}){
 if(!result||result.proofLevel!=='PROVIDER_VERIFIED')throw failure('AFAS_SOURCE_NOT_VERIFIED');
 const verified=Array.isArray(selectedFields)&&selectedFields.length>0;
 return Object.freeze({
  connectionVerified:true,availableFields:result.fields,recordCount:result.recordCount,
  sourceHash:result.sourceHash,recordValuesPersisted:false,
  readyForActivation:verified,proofLevel:'PROVIDER_VERIFIED',
  // Never return field values from a credential verification request.
  datasetPreviewIncluded:false
 });
}
