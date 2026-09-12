(function(){
  'use strict';
  var BASE='/assets/compare-slider-runtime-native-range-v13.js';
  var POINTER='/assets/compare-slider-pointer-capture-v14.js';

  function append(src,onload){
    var existing=document.querySelector('script[src="'+src+'"]');
    if(existing){
      if(onload) onload();
      return;
    }
    var script=document.createElement('script');
    script.src=src;
    script.async=false;
    if(onload) script.addEventListener('load',onload,{once:true});
    document.head.appendChild(script);
  }

  append(BASE,function(){ append(POINTER); });
})();
