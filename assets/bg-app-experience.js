/* One progressive visual app shell for the original website AND Portal V2.
   Only document navigation and browser install controls. Never a second portal,
   store, customer sender, tracking provider, executor or offline data cache. */
(function(){
 'use strict';
 // Production and HTTPS previews retain their own origin; local HTTP test/build
 // origins must never leak into public a[href] and fail canonical href integrity.
 var origin=location.protocol==='https:' ? location.origin : 'https://www.bedrijfsgeheugen.nl';
 var isPortal=location.pathname.indexOf('/portal-v2')===0||location.pathname.indexOf('/klantportaal')===0;
 var installEvent=null;
 var installButton=null;
 function standalone(){
  return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 }
 function add(tag,cls,value){
  var node=document.createElement(tag);
  if(cls)node.className=cls;
  if(value!==undefined)node.textContent=value;
  return node;
 }
 function mountDock(){
  if(isPortal||document.querySelector('[data-bg-app-public-dock]')||!document.body)return;
  var nav=add('nav','bg-app-public-dock');
  nav.dataset.bgAppPublicDock='1';
  nav.setAttribute('aria-label','Snelle navigatie Bedrijfsgeheugen');
  var items=[
   ['/','⌂','Ontdek'],
   ['/frisse-blik','◎','Scan'],
   ['/prijzen','€','Prijzen'],
   ['/portal-v2/','▣','Mijn bedrijf']
  ];
  items.forEach(function(item){
   var link=add('a','bg-app-public-dock-link');
   link.href=origin+item[0]; // Always an absolute HTTPS href in the rendered UI.
   var active=(item[0]==='/'?location.pathname==='/':location.pathname.indexOf(item[0])===0);
   if(active){link.setAttribute('aria-current','page');link.classList.add('is-current');}
   var icon=add('span','bg-app-public-dock-icon',item[1]);icon.setAttribute('aria-hidden','true');
   var label=add('span','',item[2]);
   link.append(icon,label);nav.appendChild(link);
  });
  document.body.appendChild(nav);
  document.body.classList.add('bg-app-public-has-dock');
 }
 function mountInstallAction(){
  if(standalone()||installButton||!document.body||!installEvent)return;
  installButton=add('button','bg-app-install-action','Installeer Bedrijfsgeheugen');
  installButton.type='button';
  installButton.dataset.bgInstallApp='1';
  installButton.setAttribute('aria-label','Installeer de Bedrijfsgeheugen webapp');
  installButton.addEventListener('click',async function(){
   var prompt=installEvent;installEvent=null;
   if(!prompt){installButton.hidden=true;return;}
   installButton.disabled=true;
   try{
    await prompt.prompt();
    var choice=await prompt.userChoice;
    if(choice&&choice.outcome==='accepted'){installButton.hidden=true;}
    else{installButton.hidden=true;}
   }catch(_){installButton.hidden=true;}
   installButton.disabled=false;
  });
  document.body.appendChild(installButton);
 }
 window.addEventListener('beforeinstallprompt',function(event){
  if(standalone())return;
  event.preventDefault();
  installEvent=event;
  mountInstallAction();
 });
 window.addEventListener('appinstalled',function(){
  installEvent=null;if(installButton)installButton.hidden=true;
 });
 function init(){mountDock();mountInstallAction();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 if('serviceWorker' in navigator&&
   (location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',function(){
   navigator.serviceWorker.register('/portal-v2/bg-app-sw.js',{scope:'/portal-v2/'}).catch(function(){
    // Install enhancement is optional. Never block the original website/portal.
   });
  },{once:true});
 }
})();
