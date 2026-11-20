const CACHE = 'mo14-unified-coach-v10-zaal-veld-20261120';
const ASSETS = ['./pw-logo.png','./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./coach-core.js','./coach-ui.js','./coach-plus.css','./field-unified.js','./field-unified.css'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith('mo14-zaalcoach-')||key.startsWith('mo14-unified-coach-'))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  if(!new URL(event.request.url).pathname.startsWith(new URL(self.registration.scope).pathname))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html'))));
});