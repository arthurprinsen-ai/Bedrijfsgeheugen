const HOOK_ID='bg-portal-runtime';

export function portalRuntimeHookScript(){
  return `<script id="${HOOK_ID}">
(function(){
  var navigationStart=0;
  try{var nav=performance.getEntriesByType('navigation')[0];navigationStart=nav&&Number.isFinite(nav.startTime)?nav.startTime:0;}catch(e){}
  function elapsed(){return Math.max(0,performance.now()-navigationStart);}
  function sessionId(){
    var key='bg:rum:session-id';
    try{var existing=sessionStorage.getItem(key);if(existing)return existing;var id='portal-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);sessionStorage.setItem(key,id);return id;}catch(e){return 'portal-'+Date.now().toString(36);}
  }
  async function start(){
    try{
      var user=window.netlifyIdentity&&window.netlifyIdentity.currentUser?window.netlifyIdentity.currentUser():null;
      if(!user||typeof user.jwt!=='function')return;
      var token=await user.jwt();
      if(!token)return;
      var authHeaders={authorization:'Bearer '+token};
      var runtime=await import('/platform/client/portal-runtime.mjs');
      var revision=await runtime.resolveProductionRevision();
      if(!revision)return;
      var reporter=runtime.createRuntimeReporter({authHeaders:authHeaders,revision:revision,sessionId:sessionId()});
      await reporter.reportElapsed('cached_ms',elapsed(),{route:location.pathname,cacheState:'local-cache',metadata:{navigationType:(performance.getEntriesByType('navigation')[0]||{}).type||''}});
      var canonical=await runtime.loadCanonicalPortalState({authHeaders:authHeaders,fallback:function(){return null;}});
      if(canonical&&typeof canonical==='object'){
        var compatible=canonical.legacyInputs&&typeof canonical.legacyInputs==='object'?canonical.legacyInputs:{};
        S=Object.assign({},S,canonical,compatible,{sourceMeta:canonical.sourceMeta||S.sourceMeta});
        if(typeof tekenAlles==='function')tekenAlles();
      }
      requestAnimationFrame(function(){requestAnimationFrame(function(){reporter.reportElapsed('interactive_ms',elapsed(),{route:location.pathname,cacheState:canonical?'canonical':'local-fallback',metadata:{navigationType:(performance.getEntriesByType('navigation')[0]||{}).type||''}}).catch(function(){});});});
    }catch(e){/* fail closed: legacy portal remains usable */}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
</script>`;
}

export function injectPortalRuntimeHook(html){
  const source=String(html??'');
  if(!source||source.includes(`id="${HOOK_ID}"`))return source;
  if(!/<\/body>/i.test(source))return source;
  return source.replace(/<\/body>/i,`${portalRuntimeHookScript()}\n</body>`);
}
