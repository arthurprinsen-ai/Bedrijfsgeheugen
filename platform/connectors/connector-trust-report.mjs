// Canonical per-tenant connector trust view: a control present in code is not independent security certification.
export const CONNECTOR_TRUST_CONTRACT='CONNECTOR_TRUST_EVIDENCE_V1';
const check=(id,label,status,detail)=>Object.freeze({id,label,status,detail});
export function buildConnectorTrustReport(connector,{executions=[]}={}){
 if(!connector||typeof connector!=='object'||Array.isArray(connector))throw new TypeError('CONNECTOR_DEFINITION_REQUIRED');
 const mode=['CONNECTION_ONLY','PORTAL_INSIGHTS','PORTAL_AI'].includes(connector.dataUse?.mode)?connector.dataUse.mode:'CONNECTION_ONLY';
 const routes=Array.isArray(connector.routing?.portalPages)?connector.routing.portalPages:[];
 const fields=Array.isArray(connector.routing?.selectedFields)?connector.routing.selectedFields:[];
 const explicitScope=mode==='CONNECTION_ONLY'||(routes.length>0&&fields.length>0);
 const version=Number(connector.version||0);
 const providerTestRecorded=Array.isArray(executions)&&executions.some(row=>row.status==='TEST_PASSED'&&Number(row.connector_versie??-1)===version&&row.evidence?.configVersion===version&&row.evidence?.proofLevel==='PROVIDER_VERIFIED'&&row.evidence?.sourceReadSuccess===true&&row.evidence?.extractionResult?.ok===true&&row.evidence?.validationResult?.ok===true&&row.evidence?.targetSafeTestResult?.ok===true&&typeof row.evidence?.targetSafeTestResult?.reference==='string'&&row.evidence.targetSafeTestResult.reference.length>0);
 return Object.freeze({
  contract:CONNECTOR_TRUST_CONTRACT,overall:'EVIDENCE_DUE',safeToClaimLiveData:false,fullySecurityVerified:false,providerTestRecorded,
  checks:Object.freeze([
   check('tenant','Account en organisatiescheiding','CONTROL_PRESENT','De server gebruikt een ingelogd account en leest deze koppeling alleen binnen de eigen organisatiescope. Een onafhankelijke beveiligingstest is nog vereist.'),
   check('permission','Welke gegevens mogen meedoen?',explicitScope?'CONFIGURED':'EVIDENCE_DUE',mode==='CONNECTION_ONLY'?'Extra gebruik voor portaal of AI staat uit.':explicitScope?'De gekozen velden en portaalpagina’s zijn vastgelegd; de providerrechten moeten apart worden aangetoond.':'De gegevensvelden en bestemmingen zijn nog niet compleet.'),
   check('provider','Providerverbinding',providerTestRecorded?'TEST_EVIDENCED':'EVIDENCE_DUE',providerTestRecorded?'Een proef met providerbewijs is opgeslagen, maar echte gegevensinname is niet bewezen.':'Geen actuele geverifieerde providerproef voor deze versie.'),
   check('residency','Verwerkingslocatie','EVIDENCE_DUE','Werkelijke opslag-, compute-, AI- en subverwerkerslocaties moeten per gegevensroute onafhankelijk worden bevestigd.'),
   check('storage','Veilige opslag van bronrecords','EVIDENCE_DUE','Er is nog geen onafhankelijke bron→tenantopslag-readback met herkomst en versie.'),
   check('portal','Echte waarden in het portaal','EVIDENCE_DUE','De huidige portaalweergave is uitsluitend bronmetadata. Geen gemeten KPI’s bewezen.'),
   check('ai','AI-verwerking',mode==='PORTAL_AI'?'EVIDENCE_DUE':'DISABLED',mode==='PORTAL_AI'?'AI-gebruik is aangevraagd, maar de feitelijke toegestane modelroute is niet bewezen.':'Aanvullende AI-verwerking is niet toegestaan.'),
   check('revocation','Intrekken en verwijderen','EVIDENCE_DUE','Pauzeren is niet hetzelfde als het intrekken van providertokens en het aantoonbaar wissen van gegevens.'),
   check('audit','Onafhankelijke securitychecks','EVIDENCE_DUE','OAuth/PKCE, tenantisolatie, RLS, versleuteling, webhooks, rate limits, herstel en pentestbewijs moeten per route worden gecontroleerd.')
  ]),
  nextAction:'Bewijs bronlezing, tenantgebonden opslag, portaalreadback, toestemming, intrekking en securitytests voordat deze koppeling volledig groen mag worden.'
 });
}
