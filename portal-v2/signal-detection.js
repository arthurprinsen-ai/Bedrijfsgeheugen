/**
 * Portal V2 signaleringscontract: uitsluitend tenantgebonden, expliciet ingevoerde
 * bronvelden. Geen demo-waarden, benchmarks of voorspellingen als meetbewijs.
 * Geen tweede signalerings-/Brain-databank.
 */
export const SIGNAL_METRICS=Object.freeze([
  {id:'revenue',label:'Omzet',path:'portal.metrics.revenue',unit:'EUR',page:'cijfers-maatstaven',advice:'Controleer omzet per klant, product en periode; bepaal welke verkoopactie het verschil kan verklaren.',aliases:['omzet','revenue','verkopen']},
  {id:'ebitda',label:'EBITDA',path:'portal.metrics.ebitda',unit:'EUR',page:'cijfers-maatstaven',advice:'Onderzoek marge, vaste kosten en eenmalige posten voordat je kosten ingrijpend verlaagt.',aliases:['ebitda','operationele winst']},
  {id:'grossMargin',label:'Brutomarge',path:'portal.metrics.grossMargin',unit:'%',page:'cijfers-maatstaven',advice:'Splits de marge uit naar klant, product en prijs; controleer inkoop- en kostprijsveranderingen.',aliases:['brutomarge','gross margin','marge']},
  {id:'dso',label:'Betaaltermijn debiteuren',path:'portal.metrics.dso',unit:'dagen',page:'waarde-financiering',advice:'Bekijk de openstaande posten en neem gericht contact op over achterstallige betalingen.',aliases:['debiteuren','betaaltermijn','dso']},
  {id:'cash',label:'Liquide middelen',path:'portal.valueFinance.cash',unit:'EUR',page:'waarde-financiering',advice:'Maak een actuele liquiditeitsprognose en beoordeel vervallende verplichtingen en ontvangsten.',aliases:['cash','liquiditeit','liquide middelen']},
  {id:'absence',label:'Ziekteverzuim',path:'portal.people.absence',unit:'%',page:'mensen',advice:'Controleer periode, team en oorzaken; vergelijk pas daarna met een verifieerbare branchebenchmark.',aliases:['verzuim','ziekteverzuim']},
  {id:'turnover',label:'Personeelsverloop',path:'portal.people.turnover',unit:'%',page:'mensen',advice:'Onderzoek vrijwillig vertrek en kritieke functies en stem een behoudsplan af.',aliases:['personeelsverloop','verloop']},
  {id:'leadTime',label:'Procesdoorlooptijd',path:'portal.metrics.performance.leadTime',unit:'dagen',page:'processen',advice:'Zoek wachttijd en herwerk in het proces en wijs een proceseigenaar aan.',aliases:['doorlooptijd','levertijd','lead time']}
]);
const index=new Map(SIGNAL_METRICS.map(metric=>[metric.id,metric]));
const byPath=(state,path)=>path.split('.').reduce((v,key)=>v&&typeof v==='object'?v[key]:undefined,state);
const finite=v=>v!==null&&v!==undefined&&v!==''&&typeof v!=='boolean'&&Number.isFinite(Number(v))?Number(v):null;
const cleanText=v=>String(v||'').trim().toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function metricById(id){return index.get(String(id||''))||null;}
export function parseAmount(value){
  const clean=String(value||'').trim().toLocaleLowerCase('nl-NL').replace(/\s+/g,' ').replace(/[€%]/g,'');
  const match=clean.match(/^(-?\d+(?:[.,]\d+)?)(?:\s*(duizend|miljoen|k|m))?$/);
  if(!match)return null;
  const base=Number(match[1].replace(',','.')),factor=({'duizend':1000,k:1000,miljoen:1000000,m:1000000})[match[2]]||1;
  const result=base*factor;return Number.isFinite(result)?result:null;
}
export function parseSpokenRule(input){
  const s=cleanText(input).replace(/[?!]/g,'');
  const hit=s.match(/^(?:waarschuw me als|geef een signaal als|signaleer als|maak een signalering als)\s+(.+?)\s+(onder|boven|lager dan|hoger dan|minder dan|meer dan)\s+(.+)$/);
  if(!hit)return null;
  const metric=SIGNAL_METRICS.find(m=>m.aliases.some(a=>cleanText(a)===hit[1].trim()));
  const threshold=parseAmount(hit[3]);
  if(!metric||threshold===null)return null;
  return {metricId:metric.id,operator:/onder|lager|minder/.test(hit[2])?'below':'above',threshold};
}
const CONNECTOR_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONNECTOR_FIELD=/^[\p{L}_][\p{L}\p{N}_-]{0,79}$/u;
export function normalizeSignalSource(value){
  const source=value?.source;
  if(!source||source.type===undefined||source.type==='portal')return Object.freeze({type:'portal'});
  if(source.type!=='connector'||Object.keys(source).some(k=>!['type','connectorId','field'].includes(k)))return null;
  const id=String(source.connectorId||''),field=String(source.field||'');
  if(!CONNECTOR_UUID.test(id)||!CONNECTOR_FIELD.test(field))return null;
  return Object.freeze({type:'connector',connectorId:id.toLowerCase(),field});
}
export function normalizeRule(value){
  if(!value||typeof value!=='object'||!metricById(value.metricId))return null;
  const operator=String(value.operator||'');
  if(!['above','below','missing'].includes(operator))return null;
  const threshold=operator==='missing'?null:finite(value.threshold);
  if(operator!=='missing'&&threshold===null)return null;
  const id=String(value.id||'').slice(0,96);
  if(!id)return null;
  const source=normalizeSignalSource(value);
  if(!source)return null;
  const monitoring=value.monitoring===true;
  const channels=value.channels&&typeof value.channels==='object'&&!Array.isArray(value.channels)?value.channels:{};
  // Channel flags describe explicit user intent, not actual provider delivery.
  return Object.freeze({id,metricId:value.metricId,operator,threshold,enabled:value.enabled!==false,
    severity:['hoog','midden','laag'].includes(value.severity)?value.severity:'midden',
    monitoring,source,channels:Object.freeze({portal:true,email:monitoring&&channels.email===true,push:monitoring&&channels.push===true})});
}
export function evaluateSignals(rules,state,{authenticated=false,demo=false}={}){
  if(!authenticated||demo)return Object.freeze([]);
  return Object.freeze((Array.isArray(rules)?rules:[]).slice(0,100).map(normalizeRule).filter(Boolean).map(rule=>{
    const metric=metricById(rule.metricId);
    // Connector measurements are never taken from editable portal KPI fields.
    // Only the original server Heartbeat can verify a provider ingestion receipt.
    const connected=rule.source.type==='connector';
    const value=connected?null:finite(byPath(state,metric.path));
    const missing=value===null;
    const triggered=!connected&&rule.enabled && (rule.operator==='missing'?missing:!missing && (rule.operator==='above'?value>rule.threshold:value<rule.threshold));
    const status=!rule.enabled?'uitgeschakeld':connected?'bronbewijs-open':missing&&rule.operator!=='missing'?'geen-data':triggered?'afwijking':'binnen-grens';
    const explanation=connected?'De koppeling is als bron gekozen. Een echte providerophaling en onafhankelijk teruggelezen KPI ontbreken of zijn alleen op de server te verifiëren.'
      :missing
      ?rule.operator==='missing'?'Dit bronveld heeft geen ingevoerde meetwaarde. Controleer of de bron gekoppeld en bijgewerkt is.':'Geen ingevoerde meetwaarde; een grensafwijking kan niet worden vastgesteld.'
      :rule.operator==='missing'?'Er is een ingevoerde meetwaarde; het veld ontbreekt niet.'
      :'Ingevoerde waarde '+value+' '+metric.unit+' versus ingestelde grens '+rule.threshold+' '+metric.unit+' ('+(rule.operator==='above'?'boven':'onder')+').';
    return Object.freeze({
      ...rule,metric,status,triggered,value,explanation,
      advice:connected?'Controleer de gekoppelde gegevensbron en het serverbewijs.':missing?'Controleer de bron en vul een verifieerbare meetwaarde in.':metric.advice,
      actionLabel:missing?'Bron controleren':'Bekijk analyse en start een passende actie',
      actionPage:metric.page,
      evidence:Object.freeze({sourcePath:connected?'connector:'+rule.source.connectorId+':'+rule.source.field:metric.path,sourceType:connected?'koppeling (serverbewijs vereist)':'ingevoerde portaaldata',measurementUpdatedAt:null,checkedAt:new Date().toISOString(),freshness:'onbekend'})
    });
  }));
}

/** Prepare an owned follow-up task; the V2 canonical writer performs persistence.
 * The source is a user-configured rule, not an automatically validated outcome.
 */
export function buildSignalTask(signal,{owner,due}={}){
  const rule=normalizeRule(signal);
  const metric=rule&&metricById(rule.metricId);
  const assignee=String(owner||'').trim();
  const date=String(due||'').trim();
  if(!metric||!signal?.triggered)throw new Error('SIGNAL_NOT_TRIGGERED');
  if(!assignee||assignee.length>100)throw new Error('SIGNAL_ACTION_OWNER_REQUIRED');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new Error('SIGNAL_ACTION_DUE_DATE_REQUIRED');
  return Object.freeze({
    id:'portal-signal-'+rule.id,title:'Onderzoek signaal: '+metric.label,
    department:'Bedrijfssturing',owner:assignee,due:date,status:'Open',
    description:String(signal.explanation||'')+'\nAanbevolen: '+String(signal.advice||''),
    signalRuleId:rule.id,
    evidence:{kind:'PORTAL_USER_DEFINED_THRESHOLD',sourcePath:metric.path,checkedAt:signal.evidence?.checkedAt||null,sourceFreshness:'unknown'},
    createdAt:new Date().toISOString()
  });
}
