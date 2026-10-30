// Board-level strategic decisions, projected from the existing authenticated
// Executive Cockpit. Pure rendering: no new decisions, business facts or writes.
const escapeHTML = x => String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = (...xs) => xs.find(x=>typeof x==='string'&&x.trim())?.trim()||'';
const number = v => v===undefined||v===null||v===''||typeof v==='boolean'||!Number.isFinite(Number(v))?null:Number(v);
const trusted = x => x?.evidence_health?.status==='healthy'&&Array.isArray(x?.source_refs)&&x.source_refs.some(ref=>typeof ref==='string'&&ref.trim());
const valueUnits=new Set(['EUR','HOURS','COUNT','PERCENT']);
const valueKinds=new Set(['estimated','forecast','assumption','derived']);
const nf=new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2});
const eur=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const amountLabel=(amount,unit)=>unit==='EUR'?eur.format(amount):nf.format(amount)+(unit==='HOURS'?' uur':unit==='PERCENT'?'%':unit==='COUNT'?'':'');
const optionLabel = x => text(x?.label,x?.title);
const refs = x => Array.isArray(x?.source_refs)?x.source_refs.filter(v=>typeof v==='string'&&v.trim()):[];
const safeOptions = x => Array.isArray(x?.strategic_options)?x.strategic_options.filter(o=>optionLabel(o)&&refs(o).length>0).slice(0,3):[];

export function strategicAdviceItems(model={}){
 if(model?.available!==true)return Object.freeze([]);
 const actions=Array.isArray(model.next_best_actions)?model.next_best_actions:[];
 const problems=Array.isArray(model.problems)?model.problems:[];
 const outcomes=Array.isArray(model.outcomes)?model.outcomes:[];
 return Object.freeze(actions.filter(trusted).slice(0,3).map(action=>{
   const problem=problems.find(p=>trusted(p)&&p.problem_id&&p.problem_id===action.problem_id);
   const impact=action.expected_impact||action.expectedImpact||{};
   const kind=String(impact.kind||'').toLowerCase(),unit=String(impact.unit||'').toUpperCase(),amount=number(impact.amount);
   const supported=valueKinds.has(kind)&&valueUnits.has(unit)&&amount!==null;
   const matchingOutcomes=outcomes.filter(outcome=>
     Boolean(action.id)&&trusted(outcome)&&Boolean(outcome.action_id||outcome.source_action_id)&&String(outcome.action_id||outcome.source_action_id)===String(action.id)&&
     ['VERIFIED','OUTCOME_VERIFIED','REALIZED_VERIFIED'].includes(String(outcome.verification_status||outcome.status||'').toUpperCase()));
   const diagnosis=text(problem?.title,action.problem_statement,action.explanation,action.summary);
   const rationale=text(action.reason,action.why_now,action.explanation,action.summary);
   const approval=Boolean(action.requires_approval||action.approval_required||action.decision_required);
   return Object.freeze({
     id:String(action.id||''),title:text(action.title,action.label)||'Besluit zonder titel',
     diagnosis:diagnosis||'Oorzaak nog niet vastgesteld',
     rationale:rationale||'Onderbouwing beschikbaar via de gekoppelde bronnen.',
     problemId:problem?.problem_id||null,
     expected:supported?amountLabel(amount,unit):null,
     expectedKind:supported?kind:null,
     options:Object.freeze(safeOptions(action).map(o=>Object.freeze({label:optionLabel(o),why:text(o.reason,o.tradeoff),sourceRefs:Object.freeze([...refs(o)])}))),
     sourceRefs:Object.freeze([...refs(action)]),
     owner:text(action.owner,action.accountable_owner),
     deadline:text(action.deadline,action.due_at),
     next:text(action.next_action,action.recommended_action),
     requiresApproval:approval,
     verifiedOutcomes:matchingOutcomes.length
   });
 }));
}

export function strategicAdvisorMarkup(model={}){
 const items=strategicAdviceItems(model);
 const heading='<header class="os-strategy-head"><div><small>Strategisch adviseur · één Powerhouse-brein</small><h3>Welk besluit levert jouw onderneming het meeste op?</h3></div><p>Van diagnose en opties naar een uitvoerbaar besluit en bewezen resultaat. AI-schattingen zijn geen gerealiseerde omzet.</p></header>';
 if(!items.length)return '<section class="os-strategy-advisor" data-strategy-status="evidence-due" aria-label="Strategisch ondernemersadvies">'+heading+'<div class="os-strategy-empty"><strong>Strategisch advies wacht op betrouwbare bedrijfsgegevens</strong><p>Leg je doelen vast en verbind relevante bronnen. Zonder onderbouwde kansen of acties doen we geen alsof-advies.</p><button type="button" data-os-page="evidence-health" aria-pressed="false">Bekijk benodigde gegevens →</button></div></section>';
 const cards=items.map((item,index)=>{
   const opts=item.options.length
    ?'<ul>'+item.options.map(o=>'<li><strong>'+escapeHTML(o.label)+'</strong>'+(o.why?'<span>'+escapeHTML(o.why)+'</span>':'')+'</li>').join('')+'</ul>'
    :'<p>Alternatieven inclusief niets doen zijn nog niet afzonderlijk onderbouwd; kies niet op basis van een verzonnen vergelijking.</p>';
   const impact=item.expected?'<strong>'+escapeHTML(item.expected)+'</strong><small>Verwachte impact ('+escapeHTML(item.expectedKind)+'), geen bewezen resultaat.</small>':'<strong>Nog niet betrouwbaar te kwantificeren</strong><small>Impactinschatting ontbreekt of is niet vergelijkbaar.</small>';
   return '<article class="os-strategy-card" data-advice-rank="'+(index+1)+'"><div class="os-strategy-card-header"><span>Prioriteit '+(index+1)+'</span><span>'+escapeHTML(item.owner||'Eigenaar nog niet vastgelegd')+'</span></div>'
    +'<h4>'+escapeHTML(item.title)+'</h4><p><b>Diagnose:</b> '+escapeHTML(item.diagnosis)+'</p><p><b>Waarom nu:</b> '+escapeHTML(item.rationale)+'</p>'
    +'<div class="os-strategy-impact"><span>Verwacht effect</span>'+impact+'</div>'
    +'<details><summary>Welke opties en afwegingen zijn er?</summary>'+opts+'<p>Referentieoptie: nog geen wijziging uitvoeren. De effecten daarvan zijn niet berekend.</p></details>'
    +'<p class="os-strategy-next"><b>Volgende stap:</b> '+escapeHTML(item.next||'Bekijk de onderbouwing en beslis of nader onderzoek nodig is.')+'</p>'
    +'<p class="os-strategy-status">'+(item.requiresApproval?'Besluit of toestemming vereist vóór uitvoering.':'Dit advies geeft geen automatische uitvoeringsbevoegdheid.')+' · '+(item.verifiedOutcomes?'Gekoppelde geverifieerde uitkomsten: '+item.verifiedOutcomes:'Zakelijk resultaat van deze actie nog niet bewezen.')+'</p>'
    +'<details><summary>Waarom vertrouwt Powerhouse dit advies?</summary><p>Bronnen: '+item.sourceRefs.map(escapeHTML).join(' · ')+'</p>'+(item.problemId?'<p>Probleemradar: '+escapeHTML(item.problemId)+'</p>':'')+'</details>'
    +'<button type="button" data-os-page="next-best-actions" aria-pressed="false">Bekijk besluit en actie →</button></article>';
 }).join('');
 return '<section class="os-strategy-advisor" data-strategy-status="evidence-backed" aria-label="Strategisch ondernemersadvies">'+heading+'<div class="os-strategy-grid">'+cards+'</div></section>';
}
