import { basicAuthMatches } from '../../platform/linkedin-revenue-cockpit.mjs';

const secureHeaders={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store, max-age=0',
  'Pragma':'no-cache',
  'X-Robots-Tag':'noindex, nofollow, noarchive',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer'
};
const response=(statusCode,payload,extra={})=>({statusCode,headers:{...secureHeaders,...extra},body:JSON.stringify(payload)});
const s=value=>String(value??'').trim();

async function edgeRead({state='',limit=100}={}){
  const base=s(process.env.BG_PORTAL_EU_SUPABASE_URL).replace(/\/$/,'');
  const token=s(process.env.BG_PORTAL_EU_SERVICE_TOKEN);
  if(!base||!token)throw new Error('CONTROL_PLANE_COCKPIT_EDGE_UNCONFIGURED');
  const r=await fetch(`${base}/functions/v1/growth-datahub-ingest`,{
    method:'POST',
    headers:{'content-type':'application/json','x-bg-service-token':token},
    body:JSON.stringify({action:'control_plane_cockpit',state,limit}),
    signal:AbortSignal.timeout(9000)
  });
  const payload=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(`CONTROL_PLANE_COCKPIT_EDGE_${r.status}:${payload?.error||'FAILED'}`);
  return payload;
}

export async function handler(event){
  if(event.httpMethod==='OPTIONS')return response(204,{});
  if(event.httpMethod!=='GET')return response(405,{status:'METHOD_NOT_ALLOWED'},{Allow:'GET'});
  const authorization=event.headers?.authorization||event.headers?.Authorization||'';
  if(!basicAuthMatches(authorization,s(process.env.INTERN_GEBRUIKER),s(process.env.INTERN_WACHTWOORD))){
    return response(401,{status:'UNAUTHORIZED'},{'WWW-Authenticate':'Basic realm="Intern - Bedrijfsgeheugen", charset="UTF-8"'});
  }
  const params=new URLSearchParams(event.rawQuery||'');
  const state=s(params.get('state')).toUpperCase();
  const limit=Math.min(250,Math.max(1,Number(params.get('limit'))||100));
  try{return response(200,await edgeRead({state,limit}));}
  catch(error){return response(503,{status:'DEGRADED',reason:String(error?.message||'CONTROL_PLANE_COCKPIT_FAILED')});}
}

export const config={path:'/api/powerhouse/control-plane/cockpit'};
