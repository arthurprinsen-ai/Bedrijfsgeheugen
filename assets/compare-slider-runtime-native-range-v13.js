(function(){
  'use strict';
  var BASE='/assets/compare-slider-runtime.js';
  var POINTER='/assets/compare-slider-pointer-capture-v14.js';

  function load(src,onload){
    var existing=document.querySelector('script[src="'+src+'"]');
    if(existing){
      if(onload){
        if(existing.getAttribute('data-bg-loaded')==='true') onload();
        else existing.addEventListener('load',onload,{once:true});
      }
      return;
    }
    var script=document.createElement('script');
    script.src=src;
    script.async=false;
    script.addEventListener('load',function(){
      script.setAttribute('data-bg-loaded','true');
      if(onload) onload();
    },{once:true});
    document.head.appendChild(script);
  }

  function loadPointer(){ load(POINTER); }
  if(window.__bgCompareBaseRuntimeLoaded){
    loadPointer();
  } else {
    window.__bgCompareBaseRuntimeLoaded=true;
    load(BASE,loadPointer);
  }
})();
