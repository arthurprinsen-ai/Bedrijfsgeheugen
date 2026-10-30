// Read-only entrepreneur feedback, derived solely from the existing executive
// projection. No independent outcome store, telemetry, executor or analytics.
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const finite=value=>value===null||value===undefined||value===''||typeof value==='boolean'?null:(Number.isFinite(Number(value))?Number(value):null);
const first=(...values)=>values.find(value=>value!==undefined&&value!==null&&value!=='');
const allowedStatuses=new Set(['VERIFIED','OUTCOME_VERIFIED','REALIZED_VERIFIED']);
const supportedUnits=new Set(['EUR','PERCENT','HOURS','COUNT']);
const formatter=new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2});

export function outcomeFeedbackRows(items=[]){
 if(!Array.isArray(items))return Object.freeze([]);
 return Object.freeze(items.map(item=>{
  const status=String(first(item?.verification_status,item?.status,'')).toUpperCase();
  const refs=Array.isArray(item?.source_refs)?item.source_refs.filter(ref=>typeof ref==='string'&&ref.trim()):[];
  const verified=allowedStatuses.has(status)&&item?.evidence_health?.status==='healthy'&&refs.length>0;
  const expected=finite(first(item?.expected?.amount,item?.expected_amount,item?.expectedEffect,item?.expected_effect));
  const recorded=finite(first(item?.realized?.amount,item?.realized_amount,item?.realizedEffect,item?.realized_effect,item?.measured_effect));
  const expectedUnit=String(first(item?.expected?.unit,item?.expected_unit,item?.unit,'')).toUpperCase();
  const actualUnit=String(first(item?.realized?.unit,item?.realized_unit,item?.unit,'')).toUpperCase();
  const realized=verified?recorded:null;
  const comparable=verified&&expected!==null&&realized!==null&&expectedUnit===actualUnit&&supportedUnits.has(expectedUnit);
  const learningRefs=Array.isArray(item?.learning_evidence_refs)?item.learning_evidence_refs.filter(Boolean):[];
  const learned=verified&&item?.learning_verified===true&&learningRefs.length>0&&Boolean(item?.next_decision_id||item?.next_decision);
  return Object.freeze({
   id:String(first(item?.id,item?.outcome_id,'')),
   title:String(first(item?.title,item?.label,item?.id,'Actie zonder titel')),
   domain:String(first(item?.impact_domain,item?.domain,item?.goal_label,'Bedrijfsresultaat')),
   actionId:String(first(item?.action_id,item?.source_action_id,'')),
   expected,expectedUnit,realized,actualUnit,
   delta:comparable?Number((realized-expected).toFixed(2)):null,
   comparable,verified,learned,refs:Object.freeze([...refs]),
   measuredAt:verified?String(first(item?.observed_at,item?.measured_at,'')):'',
   learningSummary:learned?String(first(item?.learning_summary,item?.learning_title,'Geverifieerde leerstap')):'',
   nextDecision:learned?String(first(item?.next_decision,item?.next_decision_id,'')):''
  });
 }).sort((a,b)=>Number(b.verified)-Number(a.verified)).slice(0,4));
}

function valueLabel(value,unit){
 if(value===null)return 'Nog onbekend';
 if(!supportedUnits.has(unit))return formatter.format(value)+' · eenheid niet vastgesteld';
 if(unit==='EUR')return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(value);
 if(unit==='PERCENT')return formatter.format(value)+'%';
 if(unit==='HOURS')return formatter.format(value)+' uur';
 return formatter.format(value);
}

export function outcomeFeedbackMarkup(items=[]){
 const rows=outcomeFeedbackRows(items);
 const intro='<div class="os-outcome-intro"><div><small>Van advies naar resultaat</small><h3>Wat heeft een actie écht opgeleverd?</h3></div><p>Verwachting is geen opbrengst. Een resultaat verschijnt pas na onafhankelijk controleerbaar bewijs.</p></div>';
 if(!rows.length)return '<section class="os-outcome-feedback" data-outcome-feedback="empty" aria-label="Effect van acties">'+intro+'<p class="os-outcome-empty">Nog geen acties met meetbare uitkomst. Zodra er betrouwbare gegevens zijn, zie je hier verwachting, resultaat en wat we leren.</p></section>';
 const cards=rows.map(row=>{
  const output=row.verified?'Resultaat onafhankelijk bevestigd':'Resultaat nog niet bewezen';
  const evidence=row.verified
   ?'<p><strong>Bronnen:</strong> '+row.refs.map(escapeHtml).join(' · ')+'</p>'+(row.measuredAt?'<p><strong>Gemeten:</strong> '+escapeHtml(row.measuredAt)+'</p>':'')
   :'<p>De actie of providerbevestiging is geen bewijs van bedrijfsimpact. De oorspronkelijke uitkomst blijft in onderzoek.</p>';
  const learn=row.learned
   ?'<p class="os-outcome-next"><strong>Powerhouse leerde:</strong> '+escapeHtml(row.learningSummary)+' · Volgende beslissing: '+escapeHtml(row.nextDecision)+'</p>'
   :'<p class="os-outcome-next">Leereffect nog niet geverifieerd. ONE BRAIN mag een onbewezen uitkomst niet als succes gebruiken.</p>';
  const compare=row.comparable
   ?'<div><dt>Verschil</dt><dd>'+escapeHtml(valueLabel(row.delta,row.actualUnit))+'</dd></div>'
   :'<div><dt>Vergelijking</dt><dd>Nog niet betrouwbaar mogelijk</dd></div>';
  return '<article class="os-outcome-card" data-outcome-verified="'+String(row.verified)+'">'
   +'<div class="os-outcome-card-head"><div><small>'+escapeHtml(row.domain)+'</small><h4>'+escapeHtml(row.title)+'</h4></div><span>'+output+'</span></div>'
   +(row.actionId?'<p class="os-outcome-action">Gekoppelde actie: '+escapeHtml(row.actionId)+'</p>':'')
   +'<dl class="os-outcome-compare"><div><dt>Vooraf verwacht</dt><dd>'+escapeHtml(valueLabel(row.expected,row.expectedUnit))+'</dd></div>'
   +'<div><dt>Werkelijk gerealiseerd</dt><dd>'+escapeHtml(valueLabel(row.realized,row.actualUnit))+'</dd></div>'+compare+'</dl>'
   +learn+'<details><summary>Hoe weten we dit?</summary>'+evidence+'</details><button type="button" class="os-outcome-more" data-os-page="monitoring-learning" aria-pressed="false">Bekijk resultaat en bewijs →</button></article>';
 }).join('');
 return '<section class="os-outcome-feedback" data-outcome-feedback="results" aria-label="Effect van acties">'+intro+'<div class="os-outcome-cards">'+cards+'</div></section>';
}
