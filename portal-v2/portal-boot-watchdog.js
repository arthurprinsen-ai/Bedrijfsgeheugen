/* Original Portal V2 boot guard: native, bounded, zero provider writes.
 * A failed module graph must not trap visitors behind a permanent blank loader.
 * The visible recovery is an ERROR state; release-readback MUST stay red.
 */
(()=>{
  const root=document.documentElement;
  const FAILURE_ID='portalStartupFailure';
  const MAX_BOOT_MS=15_000;
  const clearFailure=()=>{
    root.dataset.bgPortalAppBoot='ready';
    delete root.dataset.bgPortalBootState;
    document.getElementById(FAILURE_ID)?.remove();
  };
  globalThis.__bgMarkPortalBootReady=clearFailure;
  const showFailure=()=>{
    if(root.dataset.bgPortalAppBoot==='ready')return;
    root.dataset.bgPortalBootState='failed';
    if(document.getElementById(FAILURE_ID))return;
    const panel=document.createElement('main');
    panel.id=FAILURE_ID;
    panel.setAttribute('role','alert');
    panel.setAttribute('aria-live','assertive');
    const title=document.createElement('h1');
    title.textContent='Het portaal kon niet volledig starten';
    const message=document.createElement('p');
    message.textContent='Je gegevens zijn niet gewijzigd. Probeer het opnieuw. Als het probleem aanhoudt, neem contact op met de ondersteuning.';
    const retry=document.createElement('button');
    retry.type='button';
    retry.textContent='Probeer opnieuw';
    retry.addEventListener('click',()=>globalThis.location.reload());
    panel.append(title,message,retry);
    document.body.appendChild(panel);
  };
  const arm=()=>globalThis.setTimeout(showFailure,MAX_BOOT_MS);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arm,{once:true});
  else arm();
})();
