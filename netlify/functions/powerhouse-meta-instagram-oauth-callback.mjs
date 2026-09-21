const reply=(body,status=200,headers={})=>new Response(body,{status,headers:{'cache-control':'private, no-store','pragma':'no-cache','x-robots-tag':'noindex, nofollow, noarchive','x-content-type-options':'nosniff',...headers}});
const b64urlToText=value=>Buffer.from(value,'base64url').toString('utf8');
const bytesToB64url=bytes=>Buffer.from(bytes).toString('base64url');
const hmac=async(secret,value)=>{
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return bytesToB64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))));
};
const safeEq=(a,b)=>{
  const aa=Buffer.from(String(a)),bb=Buffer.from(String(b));
  return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);
};

export default async request=>{
  if(request.method!=='GET')return reply('Method Not Allowed',405,{allow:'GET'});
  const url=new URL(request.url);
  const code=String(url.searchParams.get('code')||'').trim();
  const state=String(url.searchParams.get('state')||'').trim();
  const error=String(url.searchParams.get('error')||'').trim();
  const errorDescription=String(url.searchParams.get('error_description')||'').trim();
  const target=new URL('/portal-v2/powerhouse-instagram-connect.html',url.origin);
  if(error){target.searchParams.set('error',errorDescription||error);return Response.redirect(target.toString(),302);}
  const serviceToken=String(Netlify.env.get('BG_PORTAL_EU_SERVICE_TOKEN')||'').trim();
  const baseUrl=String(Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim().replace(/\/$/,'');
  if(!serviceToken||!baseUrl)return reply('SERVER_CONFIG',500);
  const [payload,signature]=state.split('.');
  if(!payload||!signature)return reply('INVALID_OAUTH_STATE',400);
  const expected=await hmac(serviceToken,payload);
  if(!safeEq(signature,expected))return reply('INVALID_OAUTH_STATE',400);
  let parsed;try{parsed=JSON.parse(b64urlToText(payload))}catch{return reply('INVALID_OAUTH_STATE',400)}
  if(!parsed?.uid||!Number.isFinite(Number(parsed?.exp))||Date.now()>Number(parsed.exp))return reply('EXPIRED_OAUTH_STATE',400);
  if(!code)return reply('OAUTH_CODE_MISSING',400);
  const redirectUri='https://www.bedrijfsgeheugen.nl/api/powerhouse-meta-instagram-oauth-callback';
  const response=await fetch(`${baseUrl}/functions/v1/powerhouse-meta-instagram-setup`,{
    method:'POST',headers:{'content-type':'application/json','x-bg-service-token':serviceToken},
    body:JSON.stringify({action:'oauth_exchange',code,redirect_uri:redirectUri})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data?.ready!==true){
    target.searchParams.set('error',String(data?.detail||data?.error||'Instagram koppelen mislukt'));
    return Response.redirect(target.toString(),302);
  }
  target.searchParams.set('connected','1');
  if(data?.username)target.searchParams.set('username',String(data.username));
  return Response.redirect(target.toString(),302);
};
export const config={path:'/api/powerhouse-meta-instagram-oauth-callback'};
