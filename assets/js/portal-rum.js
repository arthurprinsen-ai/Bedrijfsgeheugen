(function(){
  'use strict';
  var SENT_KEY='bg.portal.rum.v1';
  function once(){try{if(sessionStorage.getItem(SENT_KEY))return false;sessionStorage.setItem(SENT_KEY,'1');return true;}catch(_){return true;}}
  function deviceClass(){var w=window.innerWidth||0;return w<768?'mobile':w<1100?'tablet':'desktop';}
  function revision(){var m=document.querySelector('meta[name="bg-source-revision"]');return m&&m.content?m.content:'';}
  function sessionId(){try{var k='bg.portal.session.v1',v=sessionStorage.getItem(k);if(!v){v=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2));sessionStorage.setItem(k,v);}return v;}catch(_){return '';}}
  async function token(){var identity=window.netlifyIdentity;if(!identity||typeof identity.currentUser!=='function')return null;var user=identity.currentUser();if(!user)return null;if(typeof user.jwt==='function')return user.jwt();return user.token&&user.token.access_token||null;}
  async function send(metricName,valueMs,cacheState,nav){
    var jwt=await token();if(!jwt)return;
    var body={surface:'customer-portal',route:location.pathname,metricName:metricName,metricValueMs:Math.max(0,Math.round(valueMs)),cacheState:cacheState||null,revision:revision(),sessionId:sessionId(),metadata:{navigationType:nav.type||'',effectiveType:(navigator.connection&&navigator.connection.effectiveType)||'',deviceClass:deviceClass()}};
    try{await fetch('/api/brain-runtime-metric',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+jwt},credentials:'same-origin',keepalive:true,body:JSON.stringify(body)});}catch(_){/* telemetry must never block the portal */}
  }
  async function measure(){
    if(!once())return;
    var nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];if(!nav)return;
    var interactive=nav.domInteractive-nav.startTime;
    var cached=(nav.responseEnd||0)-nav.startTime;
    var cacheState=(nav.transferSize===0&&nav.decodedBodySize>0)?'browser-cache':'network-or-revalidated';
    await Promise.all([send('interactive_ms',interactive,cacheState,nav),send('cached_ms',cached,cacheState,nav)]);
  }
  if(document.readyState==='complete')setTimeout(measure,0);else window.addEventListener('load',function(){setTimeout(measure,0);},{once:true});
})();
