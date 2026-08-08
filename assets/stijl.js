/* Bedrijfsgeheugen — gedeelde interactie */

(function(){
  var KEY='bg_consent';
  function applyConsent(state){try{if(typeof gtag==='function'){gtag('consent','update',{analytics_storage:(state==='granted'?'granted':'denied'),ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});}}catch(e){}}
  function el(){return document.getElementById('bgCookie');}
  function show(){var b=el();if(b)b.classList.add('bgShow');}
  function hide(){var b=el();if(b)b.classList.remove('bgShow');}
  function choose(state){try{localStorage.setItem(KEY,state);localStorage.setItem(KEY+'_ts',new Date().toISOString());}catch(e){}applyConsent(state);hide();}
  window.bgOpenCookies=function(){show();};
  document.addEventListener('DOMContentLoaded',function(){
    var a=document.getElementById('bgCookieAccept'),d=document.getElementById('bgCookieDeny');
    if(a)a.addEventListener('click',function(){choose('granted');});
    if(d)d.addEventListener('click',function(){choose('denied');});
    var stored=null;try{stored=localStorage.getItem(KEY);}catch(e){}
    if(stored!=='granted'&&stored!=='denied'){show();}
  });
})();
