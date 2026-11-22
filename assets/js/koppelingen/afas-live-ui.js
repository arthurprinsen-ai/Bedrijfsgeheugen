import {CONNECTOR_PORTAL_PAGES} from './portal-routing.js';
import {createConnectorApi} from './api.js';
// This extra step lives inside the ORIGINAL Studio. A saved AFAS token
// exists only in Supabase Vault; never in the connector definition.
const pageUrl=id=>'https://www.bedrijfsgeheugen.nl/portal-v2/?page='+encodeURIComponent(id);
const sensitive=s=>/(email|e.mail|telefoon|phone|voornaam|achternaam|klantnaam|customername|geboortedatum|address|adres|iban|salaris|salary)/i.test(s);
const el=(name,value='')=>{const e=document.createElement(name);e.textContent=value;return e;};
function model({environment,getConnector,page,fields=[],personalDataAuthorized=false}){
 return {name:'AFAS · '+getConnector,templateId:'afas-datahub',source:{type:'afas',environment,getConnector,personalDataAuthorized},target:{type:'datahub'},documentSchema:{type:'record',fields},mappings:fields.map(f=>({sourceField:f,targetField:f,transformation:{type:'none'}})),lookups:[],validationRules:[],schedule:{refreshMinutes:1440},dataUse:{mode:'PORTAL_INSIGHTS',modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'},routing:{portalPages:[page],selectedFields:fields}};
}
const labels=Object.freeze({
 AFAS_PROVIDER_AUTH_REQUIRED:'AFAS weigert deze GetConnector/tokencombinatie. Controleer de AppConnectorrechten.',
 AFAS_TOKEN_XML_REQUIRED:'Plak de complete AFAS XML-token.',
 AFAS_NO_ROWS_TO_VERIFY:'Geen rijen gevonden. Controleer de bron, filters en AFAS-rechten.',
 AFAS_PERSONAL_FIELDS_NEED_CONSENT:'Bevestig eerst het rechtmatig gebruik van geselecteerde persoonsgegevens.',
 AFAS_FIELD_SELECTION_INVALID:'Geselecteerde velden komen niet overeen met de echte GetConnector.',
 AFAS_AUTHORIZATION_REQUIRED:'AFAS-toegang ontbreekt. Verbind de bron opnieuw.',
 TENANT_NOT_CONFIGURED:'Je bedrijfsaccount is nog niet aan een organisatie gekoppeld.',
 PLAN_DATA_SOURCE_LIMIT:'Dit abonnement staat geen extra koppeling toe.',
 PLAN_REFRESH_LIMIT:'Dit abonnement staat de gekozen verversingsfrequentie niet toe.',
 SUBSCRIPTION_REQUIRED:'Er is een geldig abonnement nodig.'
});
const message=e=>labels[e?.code]||'Niet bevestigd: '+String(e?.code||'bron- of opslagbewijs ontbreekt')+'. De koppeling is niet als werkend geregistreerd.';
export function mountAfasLiveConnection(container,{api=createConnectorApi()}={}){
 if(!container||container.querySelector('[data-afas-live-studio]'))return null;
 const root=el('section');root.className='bg-afas-live';root.dataset.afasLiveStudio='v1';
 root.innerHTML='<h3>AFAS echt verbinden</h3><p>Verbind een AFAS GetConnector, selecteer de echte velden en toon de ingelezen records op je eigen portaalpagina. Geen testdata.</p><div class="bg-afas-grid"><label>AFAS-omgevingsnummer<input data-afas-env inputmode="numeric" placeholder="Bijvoorbeeld 12345" autocomplete="off"></label><label>GetConnector<input data-afas-name placeholder="Bijvoorbeeld BG_Verkoop" autocomplete="off"></label><label>AFAS XML-token<input data-afas-token type="password" autocomplete="new-password" placeholder="Volledige XML-token"></label><label>Bestemming in het portaal<select data-afas-page></select></label></div><div class="bg-afas-actions"><button type="button" data-afas-test>1. AFAS testen en kolommen herkennen</button><button type="button" data-afas-connect disabled>2. Gekozen gegevens importeren</button></div><p data-afas-feedback role="status" aria-live="polite">Er is nog geen verbinding bewezen.</p><fieldset data-afas-fieldset hidden><legend>Welke kolommen mogen worden gebruikt?</legend><div data-afas-columns class="bg-afas-columns"></div><label data-afas-consent-row hidden><input type="checkbox" data-afas-consent> Ik bevestig het rechtmatig gebruik van deze persoonsgegevens.</label></fieldset><div data-afas-existing class="bg-afas-existing"></div>';
 container.prepend(root);
 const get=s=>root.querySelector(s);
 const env=get('[data-afas-env]'),name=get('[data-afas-name]'),token=get('[data-afas-token]'),page=get('[data-afas-page]');
 const test=get('[data-afas-test]'),connect=get('[data-afas-connect]'),feedback=get('[data-afas-feedback]');
 const fields=get('[data-afas-fieldset]'),columns=get('[data-afas-columns]'),consent=get('[data-afas-consent]'),consentRow=get('[data-afas-consent-row]'),existing=get('[data-afas-existing]');
 const allowed=new Set(['cijfers-maatstaven','waarde-financiering','mensen','sales-intelligence','roadmap','datahubstatus','bronnenstatus']);
 for(const item of CONNECTOR_PORTAL_PAGES.filter(v=>allowed.has(v.id))){const opt=el('option',item.label);opt.value=item.id;page.append(opt);}
 page.value='cijfers-maatstaven';
 let draft=null,verifiedFields=[],busy=false;
 const status=(message,error=false)=>{feedback.textContent=message;feedback.dataset.level=error?'error':'success';};
 const config=()=>({environment:env.value.trim(),getConnector:name.value.trim(),page:page.value});
 const selected=()=>[...columns.querySelectorAll('input:checked')].map(input=>input.value);
 columns.addEventListener('change',()=>{consentRow.hidden=!selected().some(sensitive);});
 async function refresh(){
  const list=await api.list(),afas=(Array.isArray(list)?list:[]).filter(c=>c?.source?.type==='afas');
  existing.replaceChildren(el('h4','Opgeslagen AFAS-koppelingen'));
  if(!afas.length){existing.append(el('p','Nog geen AFAS-bron geautoriseerd.'));return;}
  for(const item of afas){
   const row=el('div');row.className='bg-afas-record';
   row.append(el('strong',item.name||'AFAS'),el('span',item.state==='Active'?'Actieve configuratie':'Niet actief'));
   if(item.state==='Active'){
    const sync=el('button','Ververs gegevens');sync.type='button';
    sync.addEventListener('click',async()=>{if(busy)return;busy=true;sync.disabled=true;status('Provider lezen en opslag controleren…');
     try{const result=await api.sync(item.id);if(result.status!=='SOURCE_SYNCED')throw Error('SYNC_NOT_CONFIRMED');status(result.recordCount+' AFAS-rijen veilig opgeslagen en teruggelezen.');await refresh();}
     catch(error){status(message(error),true);}finally{busy=false;sync.disabled=false;}});
    const link=el('a','Bekijk brongegevens');link.href=pageUrl(item.routing?.portalPages?.[0]||'datahubstatus');
    row.append(sync,link);
   }
   const revoke=el('button','Verwijder toegang');revoke.type='button';revoke.className='bg-afas-revoke';
   revoke.addEventListener('click',async()=>{if(busy||!window.confirm('AFAS-gegevens en het lokaal opgeslagen token verwijderen? Trek het token ook binnen AFAS zelf in.'))return;
    busy=true;revoke.disabled=true;
    try{const proof=await api.revoke(item.id);if(proof.status!=='REVOKED_LOCALLY')throw Error('REVOKE_NOT_CONFIRMED');status('AFAS-token en brondata lokaal verwijderd. Trek het token ook in AFAS in.');await refresh();}
    catch(error){status(message(error),true);}finally{busy=false;revoke.disabled=false;}});
   row.append(revoke);existing.append(row);
  }
 }
 test.addEventListener('click',async()=>{
  if(busy)return;const cfg=config();
  if(!/^\d{3,8}$/.test(cfg.environment)||!/^[\p{L}\p{N}_-]{1,80}$/u.test(cfg.getConnector)||token.value.trim().length<35){
   status('Vul een AFAS-omgevingsnummer, GetConnector en volledige XML-token in.',true);return;
  }
  busy=true;test.disabled=true;connect.disabled=true;fields.hidden=true;draft=null;verifiedFields=[];
  status('Echte AFAS-verbinding verifiëren…');
  try{
   draft=await api.createDraft(model(cfg));
   const result=await api.probe(draft.id,token.value);
   token.value='';
   if(result.status!=='FIELD_SELECTION_REQUIRED'||!result.connectionVerified||!Array.isArray(result.availableFields))throw Error('NO_PROVIDER_SCHEMA_PROOF');
   verifiedFields=result.availableFields;columns.replaceChildren();
   for(const field of verifiedFields){const label=el('label',field),check=el('input');check.type='checkbox';check.value=field;label.prepend(check);columns.append(label);}
   consent.checked=false;consentRow.hidden=true;fields.hidden=false;connect.disabled=false;
   status('Echte AFAS-bron bevestigd ('+result.recordCount+' rijen). Kies de kolommen voor het portaal.');
  }catch(error){token.value='';draft=null;status(message(error),true);}
  finally{busy=false;test.disabled=false;}
 });
 connect.addEventListener('click',async()=>{
  if(busy||!draft)return;const picked=selected();
  if(!picked.length){status('Selecteer minimaal één kolom.',true);return;}
  if(picked.some(sensitive)&&!consent.checked){status(labels.AFAS_PERSONAL_FIELDS_NEED_CONSENT,true);return;}
  busy=true;test.disabled=true;connect.disabled=true;status('Velden bevestigen, AFAS opnieuw uitlezen en gegevens veilig opslaan…');
  try{
   draft=await api.saveDraft(draft.id,model({...config(),fields:picked,personalDataAuthorized:picked.some(sensitive)&&consent.checked}));
   const probe=await api.probe(draft.id);
   if(probe.status!=='TEST_PASSED'||!probe.executionId)throw Error('PROVIDER_PROOF_REQUIRED');
   const active=await api.activate(draft.id,probe.executionId);if(active.state!=='Active')throw Error('ACTIVATION_NOT_CONFIRMED');
   const result=await api.sync(draft.id);
   if(result.status!=='SOURCE_SYNCED'||result.truth!=='ACTUAL_TENANT_SOURCE_RECORDS')throw Error('STORAGE_NOT_CONFIRMED');
   status(result.recordCount+' echte AFAS-rijen opgeslagen. Open de bijbehorende portaalpagina via de link bij je koppeling.');
   draft=null;verifiedFields=[];fields.hidden=true;await refresh();
  }catch(error){status(message(error),true);connect.disabled=false;}
  finally{busy=false;test.disabled=false;}
 });
 void refresh().catch(()=>{existing.textContent='Opgeslagen koppelingen zijn momenteel niet beschikbaar.';});
 return {root,refresh};
}
