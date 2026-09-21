export default async ()=>{
  const baseUrl=String(Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim().replace(/\/$/,'');
  const serviceToken=String(Netlify.env.get('BG_PORTAL_EU_SERVICE_TOKEN')||'').trim();
  if(!baseUrl||!serviceToken)return new Response(null,{status:500});
  const response=await fetch(`${baseUrl}/functions/v1/powerhouse-meta-instagram-setup`,{
    method:'POST',headers:{'content-type':'application/json','x-bg-service-token':serviceToken},body:JSON.stringify({action:'refresh_token'})
  });
  if(response.status===503){
    const data=await response.json().catch(()=>({}));
    if(String(data?.detail||'').includes('META_INSTAGRAM_AUTH_REQUIRED'))return new Response(null,{status:204});
  }
  return new Response(null,{status:response.ok?204:500});
};
export const config={schedule:'17 4 * * *'};
