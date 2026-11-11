/* Canonical website interaction rescue: no second navigation executor.
   Extend the existing native input slider rather than replacing its state. */
(function(){
  'use strict';
  function mountKnowledgeDrag(){
    var frame=document.getElementById('compareFrame');
    var range=document.getElementById('compareRange');
    if(!frame||!range||frame.hasAttribute('data-bg-drag-bound'))return;
    frame.setAttribute('data-bg-drag-bound','true');
    var activePointer=null;
    function updateFromPointer(event){
      var rect=frame.getBoundingClientRect();
      if(rect.width<=0)return;
      var min=Number(range.min)||0,max=Number(range.max)||100;
      var value=Math.round(Math.max(min,Math.min(max,(event.clientX-rect.left)*100/rect.width)));
      if(range.value!==String(value)){
        range.value=String(value);
        range.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }
    frame.addEventListener('pointerdown',function(event){
      if(event.pointerType==='mouse'&&event.button!==0)return;
      if(event.isPrimary===false)return;
      activePointer=event.pointerId;
      try{frame.setPointerCapture(event.pointerId)}catch(_){}
      updateFromPointer(event);
    });
    frame.addEventListener('pointermove',function(event){
      if(activePointer===event.pointerId)updateFromPointer(event);
    });
    function stop(event){
      if(activePointer!==event.pointerId)return;
      activePointer=null;
      try{if(frame.hasPointerCapture(event.pointerId))frame.releasePointerCapture(event.pointerId)}catch(_){}
    }
    frame.addEventListener('pointerup',stop);
    frame.addEventListener('pointercancel',stop);
    frame.addEventListener('lostpointercapture',function(){activePointer=null});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountKnowledgeDrag,{once:true});
  else mountKnowledgeDrag();
})();
