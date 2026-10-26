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
  // Show what Powerhouse has verifiably proposed, measured and learned.
  // Counts use the existing tenant-authorized owner projection; absent data is
  // not presented as zero, and no progress bar can imply self-driving success.
  const pilot=journey.autopilot;
  if(pilot){
    const section=add(shell,'section','eh-autopilot');
    section.dataset.entrepreneurAutopilot='proof-v1';
    section.setAttribute('aria-label','Automatische ondersteuning en bewijs');
    add(section,'span','eh-eyebrow','JOUW AUTOPILOOT · TRANSPARANT BEWIJS');
    add(section,'h4','','Wat regelt Bedrijfsgeheugen voor mij?');
    add(section,'p','eh-muted',pilot.freshRuntime
      ?'Een recente tenantgebonden Brain-runtime is waargenomen. Alleen onderstaande afzonderlijk bewezen stappen tellen mee.'
      :'De actuele Brain-runtime is niet bevestigd. Historische bewijsregistraties zeggen niets over wat nu automatisch draait.');
    const grid=add(section,'div','eh-autopilot-grid');
    for(const [label,value] of [
      ['Onderbouwde voorstellen',pilot.proposals],
      ['Besluiten die aandacht vragen',pilot.approvals],
      ['Geverifieerde resultaten',pilot.outcomes],
      ['Bewezen leerkring',pilot.learned]
    ]){
      const tile=add(grid,'div','eh-autopilot-tile');
      add(tile,'strong','',value===null?'Onbekend':String(value));
      add(tile,'span','',label);
    }
    const execution=add(section,'p','eh-autopilot-proof',pilot.autonomousExecutionVerified
      ?'Autonome uitvoering is afzonderlijk bevestigd door de bestaande uitvoeringsketen.'
      :'Zelfstandige uitvoering is nog niet end-to-end bewezen. Een voorstel, geplande taak of bronupdate geldt niet als afgeronde actie.');
    execution.setAttribute('role','status');
    add(section,'p','eh-autopilot-note','Een leerkring telt alleen wanneer een brongeverifieerde uitkomst, leerbewijs én een volgende beslissing zijn gekoppeld. Resultaat is niet automatisch aan jouw gekozen doel toe te rekenen.');
    const links=add(section,'div','eh-autopilot-links');
    const actions=add(links,'button','eh-text-action','Bekijk acties en toestemming →');
    actions.type='button';actions.dataset.entrepreneurPage='actieve-acties';
    const evidence=add(links,'button','eh-text-action','Bekijk resultaten en bewijs →');
    evidence.type='button';evidence.dataset.entrepreneurPage='outcomes-evidence';
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
