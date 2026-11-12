/* A single optional native install affordance, shared by the public site
   and existing Portal V2. This never handles customer data, app navigation,
   identity, background sync or another worker. */
(()=>{
 'use strict';
 const win=window,doc=document;
 let deferredPrompt=null;
 let installed=false;
 const standalone=()=>Boolean(win.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true);
 const appleDevice=()=>/iPad|iPhone|iPod/.test(navigator.userAgent||'')
  ||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const actionContainer=()=>doc.querySelector('#portalAccountPanel .portal-popover-links')||doc.querySelector('footer .bg-app-install-slot');
 let button=null;
 let note=null;
 const clearNote=()=>{note?.remove();note=null;};
 function syncAction(){
  const container=actionContainer();
  if(!container)return;
  const eligible=!standalone()&&!installed&&(Boolean(deferredPrompt)||appleDevice());
  if(!eligible){button?.remove();button=null;clearNote();return;}
  if(button)return;
  button=doc.createElement('button');
  button.type='button';button.id='bgInstallApp';
  button.textContent='Zet Bedrijfsgeheugen op mijn beginscherm';
  button.setAttribute('aria-label','Bedrijfsgeheugen als app installeren');
  button.addEventListener('click',async()=>{
   clearNote();
   if(deferredPrompt){
    const original=deferredPrompt;deferredPrompt=null;
    try{await original.prompt();await original.userChoice;}catch(_error){}
    syncAction();return;
   }
   if(!appleDevice())return;
   note=doc.createElement('p');
   note.className='bg-app-install-hint';note.setAttribute('role','status');
   note.textContent='Open het deelmenu van je browser en kies “Zet op beginscherm”. Daarna opent Bedrijfsgeheugen als aparte app.';
   button.after(note);
  });
  container.appendChild(button);
 }
 win.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();deferredPrompt=event;syncAction();
 });
 win.addEventListener('appinstalled',()=>{installed=true;deferredPrompt=null;syncAction();});
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',syncAction,{once:true});
 else syncAction();
 if(win.isSecureContext&&'serviceWorker' in navigator){
  win.addEventListener('load',()=>{
   navigator.serviceWorker.register('/app-sw.js',{scope:'/',updateViaCache:'none'})
    .catch(()=>{ /* App still remains an online-first authenticated website. */ });
  },{once:true});
 }
})();
