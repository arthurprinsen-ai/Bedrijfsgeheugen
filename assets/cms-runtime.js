/* Bedrijfsgeheugen canonical CMS runtime.
   Public, read-only overlay. Authority remains server-side in Supabase. */
(function(){
  'use strict';
  var cache=null, cacheKey='';
  var applying=false, scheduled=false;

  function locale(){
    var lang=(document.documentElement.getAttribute('lang')||'nl').toLowerCase();
    return lang.startsWith('en')?'en-US':'nl-NL';
  }
  function surface(){
    return location.pathname.startsWith('/portal')?'portal':'website';
  }
  function route(){
    var p=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';
    if(surface()==='portal'&&location.hash)p+=location.hash;
    return p;
  }
  function safeUrl(value){
    var v=String(value||'').trim();
    if(!v)return '';
    if(/^javascript:/i.test(v)||/^data:text\/html/i.test(v))return '';
    return v;
  }
  function sanitizeHtml(html){
    var t=document.createElement('template');
    t.innerHTML=String(html||'');
    t.content.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach(function(n){n.remove();});
    t.content.querySelectorAll('*').forEach(function(el){
      [...el.attributes].forEach(function(a){
        var n=a.name.toLowerCase(),v=a.value;
        if(n.startsWith('on'))el.removeAttribute(a.name);
        if((n==='href'||n==='src'||n==='action')&&!safeUrl(v))el.removeAttribute(a.name);
      });
    });
    return t.innerHTML;
  }
  function applyOne(item){
    if(!item||!item.selector)return;
    var nodes;
    try{nodes=[...document.querySelectorAll(item.selector)];}catch{return;}
    if(!nodes.length)return;
    var c=item.content||{};
    nodes.forEach(function(el){
      if(item.element_type==='html'&&Object.prototype.hasOwnProperty.call(c,'html'))el.innerHTML=sanitizeHtml(c.html);
      else if(item.element_type==='text'&&Object.prototype.hasOwnProperty.call(c,'text'))el.textContent=String(c.text??'');
      else if(item.element_type==='link'){
        if(Object.prototype.hasOwnProperty.call(c,'text'))el.textContent=String(c.text??'');
        if(Object.prototype.hasOwnProperty.call(c,'href')){var h=safeUrl(c.href);if(h)el.setAttribute('href',h);}
      }else if(item.element_type==='image'){
        if(Object.prototype.hasOwnProperty.call(c,'src')){var s=safeUrl(c.src);if(s)el.setAttribute('src',s);}
        if(Object.prototype.hasOwnProperty.call(c,'alt'))el.setAttribute('alt',String(c.alt??''));
      }else if(item.element_type==='meta'&&Object.prototype.hasOwnProperty.call(c,'content'))el.setAttribute('content',String(c.content??''));
      else if(item.element_type==='toggle'&&Object.prototype.hasOwnProperty.call(c,'hidden'))el.hidden=Boolean(c.hidden);
      else if(item.element_type==='attribute'&&c.attributes&&typeof c.attributes==='object'){
        Object.entries(c.attributes).forEach(function(kv){
          var name=String(kv[0]||'').trim(),value=kv[1];
          if(!name||name.toLowerCase().startsWith('on'))return;
          if((name==='href'||name==='src'||name==='action')&&!safeUrl(value))return;
          if(value===null||value===false)el.removeAttribute(name); else el.setAttribute(name,String(value));
        });
      }
      if(Number.isFinite(Number(c.order)))el.style.order=String(Number(c.order));
      el.setAttribute('data-bg-cms-key',item.element_key||'');
      el.setAttribute('data-bg-cms-version',String(item.version||1));
    });
  }
  function apply(items){
    if(applying)return;
    applying=true;
    try{(Array.isArray(items)?items:[]).forEach(applyOne);}finally{applying=false;}
  }
  async function load(force){
    var key=surface()+'|'+locale()+'|'+route();
    if(!force&&cache&&cacheKey===key){apply(cache);return cache;}
    try{
      var u='/api/cms-public?surface='+encodeURIComponent(surface())+'&locale='+encodeURIComponent(locale())+'&route='+encodeURIComponent(route());
      var r=await fetch(u,{headers:{accept:'application/json'},credentials:'same-origin'});
      if(!r.ok)return [];
      var data=await r.json();
      cache=Array.isArray(data.items)?data.items:[];cacheKey=key;apply(cache);return cache;
    }catch{return [];}
  }
  function scheduleApply(){
    if(scheduled||!cache)return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;apply(cache);});
  }
  function boot(){
    load(false);
    var observer=new MutationObserver(function(){if(!applying)scheduleApply();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('hashchange',function(){cache=null;cacheKey='';load(true);});
    window.BGCMS={reload:function(){cache=null;cacheKey='';return load(true);},apply:function(){apply(cache||[]);},route:route};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();