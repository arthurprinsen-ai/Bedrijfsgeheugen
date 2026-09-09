const SUPABASE_RESOLVER='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-l';
const ALLOWED_HOSTS=new Set(['bedrijfsgeheugen.nl','www.bedrijfsgeheugen.nl']);

function response(status,body='',headers={}){
  return new Response(body,{status,headers:{'cache-control':'no-store, max-age=0',...headers}});
}

export async function handleAttributionRedirect({key,fetchFn=globalThis.fetch}={}){
  const clean=String(key||'').trim();
  if(!/^[A-Za-z0-9_-]{4,64}$/.test(clean))return response(400,'Ongeldige link');
  const upstream=await fetchFn(`${SUPABASE_RESOLVER}?s=${encodeURIComponent(clean)}`,{redirect:'manual',headers:{accept:'application/json'}});
  if(upstream.status===404)return response(404,'Link niet gevonden');
  if(upstream.status===410)return response(410,'Link verlopen');
  if(upstream.status!==302)return response(502,'Attributie niet beschikbaar');
  const location=upstream.headers.get('location');
  try{
    const target=new URL(location||'');
    if(target.protocol!=='https:'||!ALLOWED_HOSTS.has(target.hostname.toLowerCase()))return response(502,'Ongeldige bestemming');
    return response(302,'',{location:target.toString()});
  }catch{return response(502,'Ongeldige bestemming');}
}

export default async request=>{
  const url=new URL(request.url);
  return handleAttributionRedirect({key:url.searchParams.get('s')||url.searchParams.get('key')});
};
