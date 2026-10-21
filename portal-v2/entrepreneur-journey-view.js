const add=(host,tag,className,text)=>{
  const node=host.ownerDocument.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=String(text);
  host.appendChild(node);
  return node;
};

// Deliberately read-only. Every CTA routes into an existing tenant-authorized
// page or the original Winstnavigator dialog; no duplicate business model.
export function renderEntrepreneurJourney(host,journey){
  if(!journey?.authenticated)return null;
  const shell=add(host,'section','eh-journey');
  shell.dataset.entrepreneurJourney='v1';
  shell.setAttribute('aria-label','Jouw samenhangende ondernemersreis');
  add(shell,'span','eh-eyebrow','ÉÉN BEDRIJF · ÉÉN SAMENHANG');
  add(shell,'h3','', 'Van je nulmeting naar een meetbaar resultaat');
  add(shell,'p','eh-muted','Je keuzes, bedrijfsgegevens, aanbevelingen en resultaten horen bij dezelfde beveiligde bedrijfsketen. Zonder bewijs tonen we geen rendement.');
  const stages=add(shell,'div','eh-journey-stages');
  for(const item of journey.steps){
    const card=add(stages,'div','eh-journey-stage');
    card.dataset.evidenceStatus=item.confirmed?'confirmed':'unknown';
    add(card,'span','eh-journey-signal',item.confirmed?'Aantoonbaar':'Nog te controleren');
    add(card,'strong','',item.label);
    add(card,'p','',item.detail);
  }
  const bottom=add(shell,'div','eh-journey-links');
  const cockpit=add(bottom,'article','eh-journey-panel');
  add(cockpit,'strong','','Mijn ondernemerscockpit');
  add(cockpit,'p','',journey.cockpit.ready
    ?journey.cockpit.verified+' brononderbouwde onderdelen, '+journey.cockpit.actions+' mogelijke acties en '+journey.cockpit.outcomes+' bewezen uitkomsten. Actievoorstellen zijn geen uitvoeringen.'
    :'De ondernemerscockpit gebruikt alleen mijn geauthenticeerde Powerhouse-gegevens. Zonder projectie blijven resultaten onbekend.');
  const cockpitButton=add(cockpit,'button','eh-text-action','Open mijn cockpit →');
  cockpitButton.type='button';cockpitButton.dataset.entrepreneurPage='ondernemerscockpit';
  const forecast=add(bottom,'article','eh-journey-panel');
  add(forecast,'strong','','Mijn Winstnavigator');
  add(forecast,'p','',journey.scenario.note);
  add(forecast,'small','eh-muted',journey.scenario.history+' historische meetmomenten; '+journey.scenario.sourceRefs+' met bronreferentie(s).');
  const launch=add(forecast,'button','eh-text-action','Verken scenario en verbanden →');
  launch.type='button';launch.dataset.entrepreneurNavigator='true';
  if(journey.brainReceipt||journey.dependencies.length){
    const impact=add(shell,'div','eh-journey-impact');
    add(impact,'strong','','Wat verandert mee?');
    add(impact,'p','',journey.brainReceipt?.label||
      'Deze pagina’s kunnen door een bedrijfswijziging geraakt worden. Dat is niet hetzelfde als een doorgerekend effect.');
    if(journey.dependencies.length){
      const links=add(impact,'div','eh-journey-affected');
      for(const page of journey.dependencies){
        const control=add(links,'button','eh-text-action',page.label+' →');
        control.type='button';control.dataset.entrepreneurPage=page.id;
      }
    }
  }
  const sources=add(shell,'p','eh-journey-facts',journey.heartbeat==='TENANT_RUNTIME_OBSERVED'
    ?'Recente tenantgebonden Brain-runtime gezien. Dit is geen bewijs dat iedere Heartbeat-bron, Notion-pagina, GitHub-taak of externe connector beschikbaar is.'
    :'De actuele tenantgebonden Brain/Heartbeat-runtime is nog niet bevestigd. Notion, GitHub en Netlify zijn beheer- en bewijsbronnen; alleen geautoriseerde klantprojecties zijn bedrijfsgegevens.');
  sources.setAttribute('role','status');
  return shell;
}
