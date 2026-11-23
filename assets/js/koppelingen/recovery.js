// Customer-facing diagnostics only; never display raw upstream errors or tokens.
const KNOWN=Object.freeze({
 UNAUTHORIZED:['Je sessie is verlopen.','Log opnieuw in en open deze koppeling.'],
 FORBIDDEN:['Je account mist toegang.','Controleer de rechten voor deze koppeling.'],
 ADAPTER_NOT_CONFIGURED:['Dit systeem is nog niet aangesloten.','Kies een beschikbare verbinding of laat de beheerder de provider veilig activeren.'],
 DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED:['Documentherkenning is nog niet geconfigureerd.','Verbind een toegestane extractor of gebruik eerst een voorbeeldtest.'],
 DATA_SOVEREIGNTY_CONNECTOR_BLOCKED:['De gekozen datalocatie staat deze route niet toe.','Bekijk het Data & AI Passport en kies een aantoonbaar toegestane route.'],
 DATA_SOVEREIGNTY_AI_BLOCKED:['Deze AI-verwerkingslocatie is niet vrijgegeven.','Kies een geverifieerd model en verwerkingsregio.'],
 PORTAL_DATA_USE_NOT_AUTHORIZED:['Portaalgebruik is nog niet toegestaan.','Kies expliciet welke gegevens in welke pagina’s zichtbaar mogen zijn.'],
 INVALID_CONNECTOR_ROUTING:['De gekozen velden of pagina’s zijn niet geldig.','Controleer de selecties en sla de koppeling opnieuw op.'],
 EXTERNAL_PROVIDER_PROOF_REQUIRED:['De voorbeeldtest is geslaagd, maar de externe verbinding is nog niet bewezen.','Verbind de echte bron en controleer de bestemming met onafhankelijk providerbewijs.'],
 TEST_EVIDENCE_VERSION_MISMATCH:['De koppeling is na de test gewijzigd.','Voer opnieuw een veilige test uit op de huidige versie.'],
 PLAN_REFRESH_LIMIT:['Je abonnement staat deze frequentie niet toe.','Kies een langzamer synchronisatie-interval.'],
 SUBSCRIPTION_REQUIRED:['Deze functie is niet actief in je abonnement.','Bekijk de beschikbare abonnementsopties.'],
 SAFE_TEST_SAMPLE_REQUIRED:['Er zijn nog geen testgegevens.','Kies een testsample of verbind de oorspronkelijke bron.']
});
const TRANSIENT=new Set(['408','429','502','503','504','ETIMEDOUT','ECONNRESET','EAI_AGAIN']);
export function connectorRecoveryAdvice(error){
 const code=String(error?.code||error?.error||'UNKNOWN').toUpperCase().slice(0,80);
 const status=Number(error?.status||0);
 const transient=TRANSIENT.has(code)||TRANSIENT.has(String(status));
 const [message,action]=KNOWN[code]||(transient?['De verbinding reageert tijdelijk niet.','De studio kan één veilige test opnieuw proberen.']:['De test kon niet worden afgerond.','Controleer de instellingen of kies een andere toegestane bron.']);
 return Object.freeze({code,heading:transient?'Tijdelijke storing':'Hulp bij deze koppeling',message,action,canRetry:transient,maxAutomaticSafeTestRetries:transient?1:0,requiresHuman:/(AUTH|401|403|FORBIDDEN|UNAUTHORIZED)/.test(code)});
}
