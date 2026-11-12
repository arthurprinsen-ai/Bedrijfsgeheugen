/* Bedrijfsgeheugen installed web app: network-only navigation.
   No private tenant data, tokens, API traffic, HTML, scans or outcomes are ever
   cached; no push, background sync, analytics, cron or business-side worker. */
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
const offline='<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#102f3a"><title>Verbinding nodig · Bedrijfsgeheugen</title><style>body{margin:0;display:grid;place-items:center;min-height:100dvh;padding:24px;box-sizing:border-box;font:16px/1.5 system-ui;background:#f7f9fc;color:#102f3a}main{max-width:440px;background:#fff;border:1px solid #dfe8eb;padding:26px;border-radius:22px}h1{line-height:1.2}a{color:#115f63;font-weight:700}</style></head><body><main><h1>Je bent offline</h1><p>Voor actuele bedrijfsgegevens en acties is een verbinding nodig. We bewaren geen vertrouwelijke bedrijfsgegevens op dit apparaat.</p><p><a href="https://www.bedrijfsgeheugen.nl/portal-v2/">Opnieuw openen</a></p></main></body></html>';
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||request.mode!=='navigate')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/.netlify/')||url.pathname.startsWith('/api/'))return;
 event.respondWith(fetch(request).catch(()=>new Response(offline,{
  status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}
 })));
});
