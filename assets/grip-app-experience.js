/* Bedrijfsgeheugen GripDock: one public task surface, NOT a second menu/router. */
(function(){
 'use strict';
 const SITE_ROOT=new URL('/',location.origin).href;
 const PORTAL_PATH=/^\/(?:portal-v2|klantportaal|portal-next|portal)(?:\/|$)/;
 const isPortal=PORTAL_PATH.test(location.pathname);
 const standalone=()=>Boolean(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true);
 const href=route=>new URL(route,SITE_ROOT).href;
 let installEvent=null;
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installEvent=event;
 });
 function registerSafeOffline(){
  if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;
  if(!/^(?:www\.)?bedrijfsgeheugen\.nl$/i.test(location.hostname))return;
  // Network-first navigations only. This service worker never caches customer
  // requests, provider actions, authenticated data, JS or HTML content.
  window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js',{scope:'/'})
   .catch(()=>{}),{once:true});
 }
 function add(parent,tag,className,value){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(value!==undefined)el.textContent=String(value);
  parent.appendChild(el);return el;
 }
 function installInstructions(){
  let dialog=document.getElementById('bgAppInstallInstructions');
  if(!dialog){
   dialog=add(document.body,'dialog','bg-app-install-dialog');
   dialog.id='bgAppInstallInstructions';
   dialog.setAttribute('aria-labelledby','bgAppInstallHeading');
   const body=add(dialog,'section','bg-app-install-body');
   add(body,'span','bg-app-eyebrow','BEDRIJFSGEHEUGEN');
   add(body,'h2','','Zet grip op je bedrijf op je beginscherm').id='bgAppInstallHeading';
   const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
   add(body,'p','',ios
    ?'Open deze website in Safari. Tik op Deel en kies Zet op beginscherm. Daarna opent Bedrijfsgeheugen als een eigen app.'
    :'Open het browsermenu en kies App installeren of Toevoegen aan startscherm. Als je browser dit niet ondersteunt, blijft de website volledig bruikbaar.');
   const close=add(body,'button','bg-app-install-close','Begrepen');
   close.type='button';close.addEventListener('click',()=>dialog.close());
   dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  }
  if(typeof dialog.showModal==='function')dialog.showModal();
 }
 async function tryInstall(){
  if(standalone())return;
  if(installEvent){
   const prompt=installEvent;installEvent=null;
   try{await prompt.prompt();await prompt.userChoice;}catch{installInstructions();}
  }else installInstructions();
 }
 function mountPublicDock(){
  if(isPortal||document.querySelector('[data-bg-gripdock]')||!document.body)return;
  const dock=add(document.body,'nav','bg-gripdock');
  dock.dataset.bgGripdock='v1';
  dock.setAttribute('aria-label','Grip op je bedrijf: directe taken');
  const pages=[
   {route:'/',label:'Ontdek',icon:'⌂'},
   {route:'/zelfscan',label:'Scan',icon:'◎'},
   {route:'/portal-v2/',label:'Mijn grip',icon:'◈'}
  ];
  for(const item of pages){
   const a=add(dock,'a','bg-gripdock-action');
   a.href=href(item.route);
   const pathname=location.pathname.replace(/\/$/,'')||'/';
   const route=item.route.replace(/\/$/,'')||'/';
   const active=pathname===route||item.route==='/zelfscan'&&pathname==='/frisse-blik';
   if(active)a.setAttribute('aria-current','page');
   add(a,'span','bg-gripdock-icon',item.icon).setAttribute('aria-hidden','true');
   add(a,'span','bg-gripdock-label',item.label);
  }
  const install=add(dock,'button','bg-gripdock-action bg-gripdock-install');
  install.type='button';install.dataset.bgInstallApp='true';
  add(install,'span','bg-gripdock-icon','⬇').setAttribute('aria-hidden','true');
  add(install,'span','bg-gripdock-label','Installeer');
  install.addEventListener('click',tryInstall);
  const sync=()=>{
   const current=standalone();
   dock.dataset.installed=String(current);
   install.hidden=current;
  };
  sync();window.addEventListener('appinstalled',sync);
 }
 function init(){registerSafeOffline();if(!isPortal)mountPublicDock();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
