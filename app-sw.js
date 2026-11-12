/* One service worker for the existing website and Portal V2. SECURITY:
   ONLY the public, generic offline page is cached. No personal data, HTML
   navigation responses, API replies, identity tokens, source files or form
   submissions are ever stored in the browser's Service Worker cache. */
const CACHE_NAME='bg-app-offline-public-v1';
const OFFLINE_URL='/app-offline.html';
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.add(OFFLINE_URL)));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bg-app-offline-public-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))),
  self.clients.claim()
 ]));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||request.mode!=='navigate')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 // Network only for every authenticated and public navigation.
 // This fallback can NEVER imply a fresh customer snapshot, business action or consent.
 event.respondWith(fetch(request).catch(async()=>{
  return (await caches.match(OFFLINE_URL))||Response.error();
 }));
});
