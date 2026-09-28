
import {getUser} from '@netlify/identity';

const PROJECT_URL='https://adhjwmvyoixzjtmiroln.supabase.co';
const env=name=>String(Netlify.env.get(name)||'').trim();
const serviceKey=()=>env('SUPABASE_SERVICE_ROLE_KEY')||env('SUPABASE_SERVICE_KEY')||env('SUPABASE_SECRET_KEY');
const supabaseUrl=()=>env('SUPABASE_URL')||PROJECT_URL;
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, max-age=60, stale-while-revalidate=180','content-type':'application/json; charset=utf-8'}});

async function readControl(key){
  const response=await fetch(supabaseUrl()+'/rest/v1/powerhouse_prediction_intelligence_control_v2?select=*',{headers:{apikey:key,authorization:'Bearer '+key,accept:'application/json'}});
  if(!response.ok)throw new Error('Supabase '+response.status+': '+await response.text());
  const rows=await response.json();
  return rows?.[0]||null;
}

export default async ()=>{
  const user=await getUser().catch(()=>null);
  if(!user)return json({error:'UNAUTHENTICATED'},401);
  const key=serviceKey();
  if(!key)return json({error:'SUPABASE_SERVICE_KEY_MISSING'},503);
  try{
    const control=await readControl(key);
    if(!control)return json({error:'PREDICTION_CONTROL_UNAVAILABLE'},404);
    return json(control);
  }catch(error){
    return json({error:'PREDICTION_CONTROL_READ_FAILED',message:error?.message||String(error)},502);
  }
};
export const config={path:'/api/portal-prediction-intelligence'};
