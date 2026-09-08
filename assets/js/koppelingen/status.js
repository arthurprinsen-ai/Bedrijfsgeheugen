const evidenceId=evidence=>evidence?.executionId||evidence?.testExecutionId||evidence?.runtimeExecutionId||evidence?.id||null;
const passed=evidence=>Boolean(evidence&&(evidence.ok===true||evidence.status==='TEST_PASSED')&&evidenceId(evidence));
const executed=evidence=>Boolean(evidence&&(evidence.ok===true||evidence.status==='SUCCESS'||evidence.status==='COMPLETED')&&evidenceId(evidence));
const result=(label,tone,canActivate,reason)=>Object.freeze({label,tone,canActivate,reason});

export function toHumanStatus(runtime={}){
  const state=String(runtime?.state||'').toLowerCase();
  const safeTest=runtime.lastSafeTest||runtime.safeTest||runtime.activationEvidence||null;
  const lastExecution=runtime.lastExecution||runtime.executionEvidence||null;

  if(state==='degraded'||state==='error'||state==='failed'){
    return result('Actie nodig','danger',false,runtime.reason||'De laatste controle of uitvoering is mislukt.');
  }
  if(state==='not-configured'){
    return result('Verbinding ontbreekt','muted',false,'De benodigde providerverbinding is nog niet ingesteld.');
  }
  if(state==='healthy'){
    if(executed(lastExecution))return result('Actief en gezond','success',false,'De koppeling heeft recent aantoonbaar succesvol gedraaid.');
    return result('Actie nodig','warning',false,'Gezond-status mist recente execution evidence.');
  }
  if(state==='active'){
    if(executed(lastExecution))return result('Actief en gezond','success',false,'De koppeling heeft recent aantoonbaar succesvol gedraaid.');
    return result('Actie nodig','warning',false,'De koppeling is actief, maar recente succesvolle uitvoering is niet bewezen.');
  }
  if(state==='ready'){
    if(passed(safeTest))return result('Test geslaagd','success',true,'Een succesvolle safe-test met execution evidence is vastgelegd.');
    return result('Klaar om te testen','info',false,'Voer eerst een veilige test uit en bewaar de execution evidence.');
  }
  if(state==='configured'||state==='native-provider'||state==='native-safe-test'){
    return result('Klaar om te testen','info',false,'De verbinding is beschikbaar; een succesvolle safe-test is nog verplicht.');
  }
  if(state==='sample-only'){
    return result('Nog instellen','muted',false,'Alleen een expliciete testsample is beschikbaar; een echte provider ontbreekt.');
  }
  return result('Nog instellen','muted',false,'Rond de ontbrekende configuratie af.');
}

export function activationEvidenceId(runtime={}){
  const evidence=runtime.lastSafeTest||runtime.safeTest||runtime.activationEvidence||null;
  return passed(evidence)?evidenceId(evidence):null;
}
