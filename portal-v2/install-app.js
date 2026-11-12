// Install affordance inside the ORIGINAL Portal V2 help panel.
// Only an OS/browser prompt following a user click may install the web app.
// No service worker: private tenant data is never copied to an offline cache.
export function mountPortalAppInstall({documentRef=globalThis.document,windowRef=globalThis.window}={}){
 const panel=documentRef?.getElementById?.('portalHelpPanel');
 const links=panel?.querySelector?.('.portal-popover-links');
 if(!links||links.querySelector('[data-bg-install-app]'))return null;
 const button=documentRef.createElement('button');
 button.type='button';button.dataset.bgInstallApp='v1';
 button.className='portal-install-action';
 button.textContent='Zet deze bedrijfsapp op je beginscherm';
 const status=documentRef.createElement('p');
 status.className='portal-install-status';
 status.id='portalInstallAppStatus';status.hidden=true;
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 button.setAttribute('aria-describedby',status.id);
 links.append(button);links.after(status);
 let installEvent=null;
 const isStandalone=()=>Boolean(windowRef.matchMedia?.('(display-mode: standalone)')?.matches||windowRef.navigator?.standalone===true);
 const sync=()=>{button.hidden=isStandalone();if(button.hidden)status.hidden=true;};
 const before=event=>{event.preventDefault();installEvent=event;sync();};
 const installed=()=>{installEvent=null;button.hidden=true;status.hidden=true;};
 const show=message=>{status.textContent=message;status.hidden=false;};
 const click=async()=>{
  if(isStandalone())return sync();
  if(installEvent){
   const prompt=installEvent;installEvent=null;
   try{
    await prompt.prompt();
    const choice=await prompt.userChoice;
    if(choice?.outcome==='accepted')show('Installatie aangevraagd. Open de app via je beginscherm.');
    else show('Installatie geannuleerd. Je kunt de app altijd via het browsermenu toevoegen.');
   }catch{
    show('Open het browsermenu en kies Installeer app of Toevoegen aan beginscherm.');
   }
  }else if(/iPad|iPhone|iPod/.test(windowRef.navigator?.userAgent||'')||(windowRef.navigator?.platform==='MacIntel'&&windowRef.navigator?.maxTouchPoints>1)){
   show('Open deze pagina in Safari. Kies Deel en daarna Zet op beginscherm.');
  }else{
   show('Open het browsermenu en kies Installeer app of Toevoegen aan beginscherm, wanneer beschikbaar.');
  }
  sync();
 };
 button.addEventListener('click',click);
 windowRef.addEventListener?.('beforeinstallprompt',before);
 windowRef.addEventListener?.('appinstalled',installed);
 sync();
 return Object.freeze({element:button,destroy(){
  button.removeEventListener('click',click);
  windowRef.removeEventListener?.('beforeinstallprompt',before);
  windowRef.removeEventListener?.('appinstalled',installed);
  button.remove();status.remove();
 }});
}
if(typeof document!=='undefined'&&typeof window!=='undefined')
 mountPortalAppInstall();
