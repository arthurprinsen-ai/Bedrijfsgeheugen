import { getUser } from '@netlify/identity';

const PROJECT_URL='https://adhjwmvyoixzjtmiroln.supabase.co';
const env=name=>String(Netlify.env.get(name)||'').trim();
const serviceKey=()=>env('SUPABASE_SERVICE_ROLE_KEY')||env('SUPABASE_SERVICE_KEY')||env('SUPABASE_SECRET_KEY');
const supabaseUrl=()=>env('SUPABASE_URL')||PROJECT_URL;
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, max-age=60, stale-while-revalidate=240','content-type':'application/json; charset=utf-8'}});

async function table(path,key){
  const response=await fetch(`${supabaseUrl()}/rest/v1/${path}`,{headers:{apikey:key,authorization:`Bearer ${key}`,accept:'application/json'}});
  if(!response.ok)throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return response.json();
}

export default async ()=>{
  const user=await getUser().catch(()=>null);
  if(!user)return json({error:'UNAUTHENTICATED'},401);
  const key=serviceKey();
  if(!key)return json({error:'SUPABASE_SERVICE_KEY_MISSING'},503);
  try{
    const [sources,publications,signals]=await Promise.all([
      table('bronnen?select=id,naam,uitgever,soort,controle_frequentie,laatst_gecontroleerd,laatste_controle_gelukt,actief,trefwoorden&actief=eq.true&order=uitgever.asc,naam.asc',key),
      table('bronpublicaties?select=id,bron_id,titel,samenvatting,publicatiedatum,url,opgehaald_op,goedgekeurd,uitgever_url&order=publicatiedatum.desc.nullslast&limit=350',key),
      table('bg_externe_signalen?select=url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,vertrouwen,toegestaan,opgehaald_op,deadline&order=gepubliceerd_op.desc.nullslast&limit=150',key)
    ]);
    return json({sources,publications,signals,stats:{generatedAt:new Date().toISOString(),sourceCount:sources.length,publicationCount:publications.length,signalCount:signals.length}});
  }catch(error){
    return json({error:'EXTERNAL_DATA_READ_FAILED',message:error?.message||String(error)},502);
  }
};
export const config={path:'/api/portal-ondernemersdata'};
