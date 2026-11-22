import {readImportFile,IMPORT_LIMITS} from './data-import-parser.js';
import {analyzeImportTable,confirmImportContext,IMPORT_DATA_KINDS,IMPORT_AREAS,IMPORT_GRAINS,IMPORT_ROLES} from './data-import-semantics.js';

const MAX_DATASETS=20;
const MAX_TOTAL_BYTES=450*1024;
const principal=client=>{
  const snap=client?.getSnapshot?.(),user=client?.currentUser?.();
  return !client?.isDemo?.()&&user?.id&&String(snap?.user?.id||"")===String(user.id)
    &&["authenticated","empty"].includes(snap?.mode)?String(user.id):"";
};
const saved=client=>{
  const list=client?.getSnapshot?.()?.state?.portal?.dataImports?.datasets;
  return Array.isArray(list)?list:[];
};
const encodedSize=value=>new TextEncoder().encode(JSON.stringify(value)).length;
function textNode(tag,value,cls=""){
  const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=String(value??"");return el;
}
export async function fileFingerprint(file){
  if(!globalThis.crypto?.subtle)throw new Error("SHA-256 is niet beschikbaar in deze browser.");
  const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
  return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,"0")).join("");
}
export function buildImportRecord(file,table,fingerprint,semantic=null){
  if(!/^[a-f0-9]{64}$/.test(fingerprint))throw new Error("Ongeldige bestandsvingerafdruk.");
  return Object.freeze({
    id:"file-"+fingerprint.slice(0,32),fingerprint,
    sourceType:file.name.toLowerCase().endsWith(".csv")?"CSV":"Excel",
    fileName:String(file.name).slice(0,180),fileSize:file.size,
    importedAt:new Date().toISOString(),sheet:table.sheet,columns:table.columns,
    rows:table.rows,rowCount:table.rowCount,
    ...(semantic?{semantic}:{}),
    provenance:{origin:"user-upload",reviewed:true,automaticMapping:false,measuredOutcome:false}
  });
}
export function validateImportCapacity(datasets,record){
  if(datasets.some(row=>row.fingerprint===record.fingerprint))throw new Error("Dit bestand is al geïmporteerd. Er is niets dubbel opgeslagen.");
  if(datasets.length>=MAX_DATASETS)throw new Error("Er staan al 20 bestanden in dit portaal. Gebruik voor structurele datasets een gegevenskoppeling.");
  if(encodedSize({datasets:[...datasets,record]})>MAX_TOTAL_BYTES)
    throw new Error("Deze import overschrijdt de veilige gezamenlijke opslaggrens van 450 KB. Gebruik voor grote datasets een koppeling.");
}

const modalMarkup=[
'<div class="bg-import-head"><div><span class="bg-import-kicker">DATA & KOPPELINGEN</span>',
'<h2 id="portalDataImportTitle">Gegevens importeren</h2><p>Van CSV of Excel naar jouw Bedrijfsgeheugen.</p></div>',
'<button type="button" class="bg-import-close" data-close aria-label="Sluiten">×</button></div>',
'<div class="bg-import-content"><label class="bg-import-drop" id="bgImportDrop" for="bgImportFile">',
'<span class="bg-import-upload">↑</span><strong>Kies een bestand of sleep het hierheen</strong>',
'<small>CSV of Excel (.xlsx) · maximaal 4 MB · geen automatische overschrijving</small>',
'<input type="file" id="bgImportFile" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label>',
'<p class="bg-import-hint">De eerste rij wordt als kolomnamen gelezen. Controleer het voorbeeld en bevestig zelf.</p>',
'<div id="bgImportPreview" hidden><div class="bg-import-summary" id="bgImportSummary"></div>',
'<section class="bg-import-context" id="bgImportContext" aria-label="Betekenis en gebruik van dit bestand">',
'<div class="bg-import-context-intro"><strong id="bgImportSuggestion"></strong><small id="bgImportWhy"></small></div>',
'<div class="bg-import-context-grid">',
'<label>Wat voor gegevens zijn dit?<select id="bgImportKind"></select></label>',
'<label>Voor welk bedrijfsdoel?<input id="bgImportPurpose" type="text" maxlength="180" required placeholder="Bijvoorbeeld: maandelijkse omzet beoordelen"></label>',
'<label>Waar horen ze thuis?<select id="bgImportArea"></select></label>',
'<label>Wat stelt één rij voor?<select id="bgImportGrain"></select></label>',
'<label>Uit welk systeem komen ze?<input id="bgImportSourceSystem" type="text" maxlength="100" placeholder="Bijvoorbeeld: Exact, AFAS, Salesforce"></label>',
'</div>',
'<p class="bg-import-hint" id="bgImportPeriod"></p>',
'<p id="bgImportQuality" class="bg-import-quality"></p>',
'<details class="bg-import-mappings" open><summary>Controleer de betekenis van de kolommen</summary><div id="bgImportMappings"></div></details>',
'<p id="bgImportRestricted" class="bg-import-restricted" hidden></p>',
'<label id="bgImportPersonalNotice" class="bg-import-personal" hidden><input type="checkbox" id="bgImportPersonalAuthorized">Ik bevestig dat deze persoonsgegevens rechtmatig voor dit doel mogen worden verwerkt.</label>',
'<label class="bg-import-review"><input type="checkbox" id="bgImportReviewed">Ik heb het datatype, doel, bestemming en de kolommen gecontroleerd. Sla het alleen op voor analyse; wijzig geen KPI’s of andere bronnen automatisch.</label>',
'</section>',
'<div class="bg-import-tablewrap"><table><thead id="bgImportHead"></thead><tbody id="bgImportRows"></tbody></table></div>',
'<p class="bg-import-hint">Voorbeeld van de eerste vijf rijen. Bestaande KPI’s en relaties worden niet automatisch overschreven.</p>',
'<button id="bgImportConfirm" class="bg-import-confirm" type="button">Gegevens veilig importeren</button></div>',
'<p id="bgImportStatus" role="status" aria-live="polite"></p>',
'<section class="bg-import-history"><h3>Al geïmporteerd</h3><div id="bgImportSaved"></div></section></div>'
].join("");

export function mountDataImport({stateClient,domainState,root=globalThis.document}={}){
  if(!root||!stateClient||!domainState)return null;
  const host=root.querySelector(".topactions .actionrow")||root.querySelector(".topactions");
  if(!host||root.getElementById("portalDataImportButton"))return null;
  const launch=root.createElement("button");launch.type="button";
  launch.id="portalDataImportButton";launch.className="smallbtn bg-import-launch";
  launch.textContent="↑ Importeer CSV / Excel";
  launch.setAttribute("aria-haspopup","dialog");launch.setAttribute("aria-controls","portalDataImportDialog");
  host.insertBefore(launch,host.firstChild);
  const dialog=root.createElement("dialog");dialog.id="portalDataImportDialog";
  dialog.className="bg-import-dialog";dialog.setAttribute("aria-labelledby","portalDataImportTitle");
  dialog.innerHTML=modalMarkup;root.body.appendChild(dialog);
  const file=dialog.querySelector("#bgImportFile"),preview=dialog.querySelector("#bgImportPreview");
  const status=dialog.querySelector("#bgImportStatus"),summary=dialog.querySelector("#bgImportSummary");
  const head=dialog.querySelector("#bgImportHead"),body=dialog.querySelector("#bgImportRows");
  const confirm=dialog.querySelector("#bgImportConfirm"),drop=dialog.querySelector("#bgImportDrop");
  const history=dialog.querySelector("#bgImportSaved");
  const contextPanel=dialog.querySelector("#bgImportContext"),kind=dialog.querySelector("#bgImportKind");
  const purpose=dialog.querySelector("#bgImportPurpose"),area=dialog.querySelector("#bgImportArea");
  const grain=dialog.querySelector("#bgImportGrain"),sourceSystem=dialog.querySelector("#bgImportSourceSystem");
  const suggestion=dialog.querySelector("#bgImportSuggestion"),why=dialog.querySelector("#bgImportWhy");
  const period=dialog.querySelector("#bgImportPeriod"),quality=dialog.querySelector("#bgImportQuality");
  const mappings=dialog.querySelector("#bgImportMappings"),reviewed=dialog.querySelector("#bgImportReviewed");
  const privacyNotice=dialog.querySelector("#bgImportPersonalNotice"),privacyConfirmed=dialog.querySelector("#bgImportPersonalAuthorized");
  const restricted=dialog.querySelector("#bgImportRestricted");
  const choices=(select,definitions)=>{select.replaceChildren();
    for(const item of definitions){const option=root.createElement("option");option.value=item.id;option.textContent=item.label;select.append(option);}
  };
  choices(kind,IMPORT_DATA_KINDS);choices(area,IMPORT_AREAS);choices(grain,IMPORT_GRAINS);
  function updateSaveButton(){
    const hasPrivacy=staged?.analysis?.personalColumns?.length||[...mappings.querySelectorAll("select")].some(select=>select.value==="personal");
    privacyNotice.hidden=!hasPrivacy;
    if(!hasPrivacy)privacyConfirmed.checked=false;
    confirm.disabled=busy||!staged||!reviewed.checked||(hasPrivacy&&!privacyConfirmed.checked)||!!staged.analysis.restrictedColumns.length;
  }
  function showContext(analysis){
    kind.value=analysis.suggestedKind;area.value=analysis.suggestedArea;grain.value=analysis.suggestedGrain;
    purpose.value=analysis.suggestedPurpose;sourceSystem.value="";
    reviewed.checked=false;privacyConfirmed.checked=false;
    restricted.hidden=!analysis.restrictedColumns.length;
    restricted.textContent=analysis.restrictedColumns.length
      ?"Dit bestand bevat mogelijk hooggevoelige velden ("+analysis.restrictedColumns.join(", ")+"). Gebruik hiervoor eerst een beveiligde koppeling met privacycontrole."
      :"";
    const guessed=IMPORT_DATA_KINDS.find(item=>item.id===analysis.suggestedKind);
    suggestion.textContent=analysis.suggestedKind==="other"
      ?"Bestandstype nog onbekend — kies zelf wat dit voor gegevens zijn."
      :"Voorstel: "+guessed.label;
    why.textContent=analysis.confidence==="high"
      ?"Herkenning op basis van meerdere kolomnamen, nog niet bevestigd."
      :"Voorlopig voorstel op basis van bestands- en kolomnamen. Controle is noodzakelijk.";
    period.textContent=analysis.period
      ?"Herkende gegevensperiode: "+analysis.period.from+" t/m "+analysis.period.to+" (kolom "+analysis.period.column+")."
      :"Geen betrouwbare periode herkend. De datums blijven ongewijzigd in de bron.";
    quality.textContent=analysis.quality.rows+" rijen · "+analysis.quality.columns+" kolommen · "
      +analysis.quality.missingCells+" lege waarden · "+analysis.quality.duplicatedRows+" volledig identieke rijen. Niets is automatisch verwijderd.";
    mappings.replaceChildren();
    for(const proposed of analysis.columnMappings){
      const label=textNode("label","","bg-import-mapping-row");
      label.append(textNode("span",proposed.column));
      const select=root.createElement("select");
      select.dataset.column=proposed.column;select.setAttribute("aria-label","Betekenis van kolom "+proposed.column);
      choices(select,IMPORT_ROLES);select.value=proposed.role;
      label.append(select);mappings.append(label);
    }
    updateSaveButton();
  }
  contextPanel.addEventListener("input",event=>{
    if(event.target!==reviewed&&event.target!==privacyConfirmed)reviewed.checked=false;
    updateSaveButton();
  });
  contextPanel.addEventListener("change",event=>{
    if(event.target===kind){
      const target=IMPORT_DATA_KINDS.find(item=>item.id===kind.value);
      if(target){area.value=target.area;grain.value=target.grain;purpose.value=target.purpose;}
    }
    if(event.target!==reviewed&&event.target!==privacyConfirmed)reviewed.checked=false;
    updateSaveButton();
  });
  function confirmedSemantic(){
    if(!staged)throw new Error("Selecteer eerst het bestand.");
    const form={
      kind:kind.value,area:area.value,grain:grain.value,purpose:purpose.value,
      sourceSystem:sourceSystem.value,confirmed:reviewed.checked,
      personalAuthorized:privacyConfirmed.checked,
      mappings:[...mappings.querySelectorAll("select")].map(select=>({column:select.dataset.column,role:select.value}))
    };
    return confirmImportContext(staged.analysis,form);
  }
  let staged=null,busy=false,revision=0;
  function report(message,level="info"){status.textContent=message;status.dataset.level=level;}
  function reset(){
    staged=null;revision++;preview.hidden=true;summary.replaceChildren();
    head.replaceChildren();body.replaceChildren();mappings.replaceChildren();
    file.value="";reviewed.checked=false;privacyConfirmed.checked=false;confirm.disabled=true;report("");
  }
  function renderSaved(){
    history.replaceChildren();
    if(!principal(stateClient)){history.append(textNode("p","Log in om opgeslagen bestanden te zien."));return;}
    const items=saved(stateClient);
    if(!items.length){history.append(textNode("p","Nog geen gegevens geïmporteerd."));return;}
    for(const item of [...items].reverse()){
      const row=textNode("div","","bg-import-history-item");
      const name=IMPORT_DATA_KINDS.find(value=>value.id===item.semantic?.kind)?.label||"Niet geclassificeerd";
      const destination=IMPORT_AREAS.find(value=>value.id===item.semantic?.area)?.label||"Bestemming onbekend";
      row.append(textNode("strong",(item.fileName||"Import")+" · "+name),
        textNode("span",String(item.rowCount??0)+" rijen · "+destination+" · "+String(item.importedAt||"").slice(0,10)),
        textNode("small",item.semantic?.purpose||"Doel nog niet geregistreerd"));
      history.append(row);
    }
  }
  function showPreview(fileObject,table){
    preview.hidden=false;summary.replaceChildren(textNode("strong",fileObject.name),
      textNode("span",table.rowCount+" rijen · "+table.columns.length+" kolommen · "+table.sheet));
    const tr=root.createElement("tr");
    for(const label of table.columns)tr.append(textNode("th",label));
    head.replaceChildren(tr);body.replaceChildren();
    for(const values of table.rows.slice(0,5)){
      const row=root.createElement("tr");
      for(const value of values)row.append(textNode("td",value));
      body.append(row);
    }
    showContext(staged.analysis);
  }
  async function stage(selected){
    const mine=++revision;staged=null;preview.hidden=true;confirm.disabled=true;
    const owner=principal(stateClient);
    if(!owner||!domainState.initialized?.()){
      report("Log eerst in met je bedrijfsaccount. Demo-import is niet toegestaan.","error");return;
    }
    if(!selected){report("Selecteer een bestand.","error");return;}
    if(busy)return;
    busy=true;report("Bestand lokaal lezen en valideren…");
    try{
      const table=await readImportFile(selected);
      const fingerprint=await fileFingerprint(selected);
      if(mine!==revision||principal(stateClient)!==owner)return;
      const analysis=analyzeImportTable(table,{fileName:selected.name});
      validateImportCapacity(saved(stateClient),buildImportRecord(selected,table,fingerprint));
      staged={owner,fileObject:selected,table,fingerprint,analysis};showPreview(selected,table);
      report("Bestand gelezen. Controleer eerst waarvoor deze gegevens dienen en bevestig daarna de import.","success");
    }catch(error){if(mine===revision)report(error.message||"Import niet mogelijk.","error");}
    finally{busy=false;}
  }
  async function persist(){
    if(!staged||busy)return;
    const {owner}=staged;
    if(principal(stateClient)!==owner||!domainState.initialized?.()){
      reset();report("De sessie is gewijzigd. Selecteer het bestand opnieuw.","error");return;
    }
    busy=true;confirm.disabled=true;report("Gegevens en zakelijke betekenis gecontroleerd opslaan…");
    try{
      const semantic=confirmedSemantic();
      const record=buildImportRecord(staged.fileObject,staged.table,staged.fingerprint,semantic);
      const current=domainState.get("portal.dataImports")||{};
      const datasets=Array.isArray(current.datasets)?current.datasets:[];
      // A previous attempt may have saved the tenant state before a downstream Brain ACK failed.
      // Retry the original handoff; do not append a second copy or declare success early.
      const pendingSame=datasets.find(item=>item.fingerprint===record.fingerprint);
      if(!pendingSame){
        validateImportCapacity(datasets,record);
        domainState.patch("portal.dataImports",{datasets:[...datasets,record]});
      }else if(pendingSame.id!==record.id){throw new Error("Er bestaat een conflicterende importversie.");}
      else if(JSON.stringify(pendingSame.semantic)!==JSON.stringify(record.semantic)){
        // A previous, unconfirmed attempt might already have been persisted.
        // Never silently relabel its source purpose during replay.
        throw new Error("Dit bestand is al met een andere betekenis opgeslagen. Controleer de bestaande bron.");
      }
      const ack=await domainState.flush();
      if(!["saved","idle"].includes(ack?.status))throw new Error("De opslag is nog niet bevestigd.");
      if(principal(stateClient)!==owner)throw new Error("De gebruikerssessie is veranderd.");
      const response=await stateClient.load();
      const found=response?.state?.portal?.dataImports?.datasets?.find(item=>item.id===record.id);
      if(String(response?.user?.id||"")!==owner||found?.fingerprint!==record.fingerprint
        ||found?.rowCount!==record.rowCount||JSON.stringify(found?.semantic)!==JSON.stringify(record.semantic))
        throw new Error("Server-readback van bestand én zakelijke betekenis ontbreekt.");
      reset();renderSaved();
      report(record.rowCount+" rijen inclusief doel, betekenis en bestemming zijn opgeslagen en teruggelezen. Geen KPI’s gewijzigd.","success");
    }catch(error){
      report("Nog niet als voltooid bevestigd: "+String(error.message||error)+". Probeer opnieuw na controle van je verbinding.","error");
      confirm.disabled=false;
    }finally{busy=false;}
  }
  launch.addEventListener("click",()=>{if(!dialog.open){reset();renderSaved();dialog.showModal();}});
  dialog.querySelector("[data-close]").addEventListener("click",()=>dialog.close());
  file.addEventListener("change",()=>void stage(file.files?.[0]));
  confirm.addEventListener("click",()=>void persist());
  drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("is-over");});
  drop.addEventListener("dragleave",()=>drop.classList.remove("is-over"));
  drop.addEventListener("drop",e=>{
    e.preventDefault();drop.classList.remove("is-over");
    const selected=e.dataTransfer?.files?.[0];if(selected)void stage(selected);
  });
  let lastOwner=principal(stateClient);
  const unsubscribe=stateClient.subscribe(()=>{
    const next=principal(stateClient);
    if(next!==lastOwner){lastOwner=next;reset();if(dialog.open)dialog.close();}
    if(dialog.open)renderSaved();
  });
  return {open:()=>launch.click(),destroy:()=>{unsubscribe();launch.remove();dialog.remove();},limits:IMPORT_LIMITS};
}
