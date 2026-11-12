/* Bedrijfsgeheugen PWA — connectivity fallback ONLY, no private/business cache. */
'use strict';
const VERSION='bg-offline-20261112-v1';
const OFFLINE='/offline.html';
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(VERSION).then(async cache=>{
  // The original website sets Vary:* on document responses; CacheStorage
  // refuses those responses. Strip only *public offline-page* headers by
  // creating a fresh static response. Never cache the source response itself.
  const response=await fetch(OFFLINE,{cache:'no-store'});
  if(!response.ok)throw new Error('OFFLINE_PAGE_UNAVAILABLE');
  const html=await response.text();
  await cache.put(OFFLINE,new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}}));
 }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bg-offline-')&&key!==VERSION).map(key=>caches.delete(key)))),
  self.clients.claim()
 ]));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 // Always go directly to the network for every customer/tenant API, portal
 // document, script, asset, post, upload and provider action. Only a public
 // offline information page is stored; never cache source state or identities.
 if(request.mode!=='navigate'||request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith(fetch(request).catch(async()=>{
  const cache=await caches.open(VERSION);
  const fallback=await cache.match(OFFLINE);
  return fallback||Response.error();
 }));
});
