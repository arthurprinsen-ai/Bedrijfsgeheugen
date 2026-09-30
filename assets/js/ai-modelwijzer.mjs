const C=window.BG_AI_MODEL_CATALOG||{models:[],providers:[],governance_questions:[]};
const $=s=>document.querySelector(s);
const euro=n=>n==null?'te verifiëren':'$'+Number(n).toFixed(n<1?2:0);
const fmt=n=>n?Intl.NumberFormat('nl-NL',{notation:'compact'}).format(n):'—';
const txt=v=>String(v??'').toLowerCase();
const taskSignals=[
  {k:['code','programmeren','developer','software','refactor','debug'],dim:'coding',label:'programmeren'},
  {k:['schrijf','tekst','content','blog','email','mail','offerte'],dim:'writing',label:'schrijven'},
  {k:['analyse','strategie','onderzoek','research','redeneer','complex'],dim:'analysis',label:'analyse'},
  {k:['bulk','duizend','classificeer','classificatie','samenvat','supportmail'],dim:'cost_efficiency',label:'volume'},
  {k:['snel','latency','realtime'],dim:'speed',label:'snelheid'},
  {k:['privacy','avg','gdpr','gevoelig','vertrouwelijk','eu','eer','soeverein'],dim:'governance',label:'governance'},
  {k:['robot','spatial','ruimte','video'],dim:'reasoning',label:'multimodaal'},
  {k:['rag','embedding','semantic','zoeken','kennisbank'],dim:'analysis',label:'RAG/zoeken'}
];
function goalProfile(goal){
  const g=txt(goal),hits=[];
  taskSignals.forEach(s=>{if(s.k.some(k=>g.includes(k)))hits.push(s)});
  if(!hits.length)hits.push({dim:'analysis',label:'algemeen'});
  return hits;
}
function specialistPenalty(m,goal){
  const g=txt(goal), id=txt(m.id+' '+m.name+' '+(m.best_for||[]).join(' '));
  const checks=[
    {model:/embed/,goal:/embed|rag|semantic|vector|kennisbank|zoeken/},
    {model:/ocr/,goal:/ocr|pdf|document|factuur|scan|uitlezen/},
    {model:/image|banana|sunburst|flare/,goal:/afbeeld|image|foto|beeld|visual|design/},
    {model:/audio|live|realtime|tts|transcrib|voxtral/,goal:/audio|spraak|stem|voice|transcrib|gesprek|realtime|vertal/},
    {model:/moderation|shieldstral/,goal:/moder|veilig|safety|tox|beleid|contentcontrole/},
    {model:/robot/,goal:/robot|spatial|ruimte|embodied/}
  ];
  let p=0;for(const x of checks)if(x.model.test(id)&&!x.goal.test(g))p+=4;
  if(/retired|deprecated/.test(txt(m.status)))p+=20;
  return p;
}
function govPenalty(m,eu){
  let p=0;
  if(eu==='required'&&!/eu|europe/i.test(txt(m.eu_option)))p+=5;
  if(eu==='prefer'&&/no-verified|verify/i.test(txt(m.eu_option)))p+=2;
  if(/verify-before|unknown|verify-policy/i.test(txt(m.data_residency)+' '+txt(m.training_on_api_data)))p+=1.5;
  return p;
}
function scoreModel(m,goal,priority,eu){
  const profile=goalProfile(goal);let score=5;
  profile.forEach(s=>{
    if(s.dim==='governance')score+=/eu|europe/i.test(txt(m.eu_option))?3:-1;
    else score+=(Number(m[s.dim])||5)*.45;
  });
  if(priority==='quality')score+=(Number(m.reasoning)||5)*.55+(Number(m.analysis)||5)*.35;
  if(priority==='cost')score+=(Number(m.cost_efficiency)||5)*.85;
  if(priority==='speed')score+=(Number(m.speed)||5)*.85;
  if(priority==='privacy')score+=/eu|europe/i.test(txt(m.eu_option))?5:-2;
  score-=govPenalty(m,eu);score-=specialistPenalty(m,goal);
  if(m.status!=='active')score-=1;
  return Math.max(0,Math.min(100,Math.round(score*6)));
}
function monthlyCost(m){
  const i=Math.max(0,Number($('#inputTokens').value)||0)/1e6;
  const o=Math.max(0,Number($('#outputTokens').value)||0)/1e6;
  if(m.input_usd_mtok==null||m.output_usd_mtok==null)return null;
  return i*m.input_usd_mtok+o*m.output_usd_mtok;
}
function renderAdvice(){
  const goal=$('#goal').value.trim();
  if(!goal){$('#advisorStatus').textContent='Beschrijf eerst wat je wilt doen.';return}
  const priority=$('#priority').value,eu=$('#eu').value;
  const ranked=C.models.map(m=>({...m,_score:scoreModel(m,goal,priority,eu),_cost:monthlyCost(m)})).sort((a,b)=>b._score-a._score);
  const top=ranked.slice(0,5);
  $('#recommendations').classList.remove('hidden');
  $('#summary').textContent='Doel herkend als '+goalProfile(goal).map(x=>x.label).join(', ')+'. De score combineert taak-fit, jouw prioriteit en governance-eisen. Onbekende governancevelden tellen niet als bewezen geschikt.';
  $('#results').innerHTML=top.map((m,i)=>`<article class="result">
    <div><div class="brand">${m.provider}</div><div class="model">${i===0?'Aanbevolen · ':''}${m.name}</div><div class="why">${(m.best_for||[]).slice(0,4).join(' · ')}</div></div>
    <div class="metric"><b class="score">${m._score}/100</b><span>fit-score</span></div>
    <div class="metric"><b>${m._cost==null?'prijs checken':'$'+m._cost.toFixed(2)+'/mnd'}</b><span>op jouw tokenvolume</span></div>
    <div><span class="tag ${/eu|europe/i.test(txt(m.eu_option))?'good':/verify|no-verified/i.test(txt(m.eu_option))?'warn':''}">${m.eu_option||'EU: onbekend'}</span><span class="tag">${m.status}</span></div>
    <a href="${m.source}" target="_blank" rel="noopener">bron ↗</a>
  </article>`).join('');
  $('#advisorStatus').textContent='Advies berekend. Controleer bij gevoelige data altijd de actuele contract- en residencyvoorwaarden.';
  $('#recommendations').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderTable(){
  const p=$('#providerFilter').value,s=$('#statusFilter').value,eu=$('#euFilter').value,q=txt($('#search').value);
  const rows=C.models.filter(m=>(!p||m.provider===p)&&(!s||m.status===s)&&(!eu||/eu|europe/i.test(txt(m.eu_option)))&&(!q||txt(m.name+' '+m.provider+' '+(m.best_for||[]).join(' ')).includes(q)));
  $('#modelRows').innerHTML=rows.map(m=>`<tr>
    <td><b>${m.name}</b><br><span class="brand">${m.provider}</span></td><td>${m.status}</td>
    <td>${euro(m.input_usd_mtok)}</td><td>${euro(m.output_usd_mtok)}</td><td>${fmt(m.context_tokens)}</td>
    <td>${m.reasoning??'—'}/10</td><td>${m.coding??'—'}/10</td><td>${m.speed??'—'}/10</td>
    <td><span class="tag ${/eu|europe/i.test(txt(m.eu_option))?'good':/verify|no-verified/i.test(txt(m.eu_option))?'warn':''}">${m.eu_option||'onbekend'}</span><br><small>${m.data_residency||'te verifiëren'}</small></td>
    <td>${m.self_host===true?'ja':m.self_host===false?'nee':m.self_host||'te verifiëren'}</td>
    <td>${(m.best_for||[]).slice(0,3).join(', ')}</td><td><a href="${m.source}" target="_blank" rel="noopener">${m.verified_at||'bron'} ↗</a></td>
  </tr>`).join('');
}
C.providers.forEach(p=>$('#providerFilter').insertAdjacentHTML('beforeend',`<option value="${p.id}">${p.name}</option>`));
$('#govQuestions').innerHTML=C.governance_questions.map(q=>`<li>${q}</li>`).join('');
$('#advise').addEventListener('click',renderAdvice);
$('#showAll').addEventListener('click',()=>$('#compare').scrollIntoView({behavior:'smooth'}));
['providerFilter','statusFilter','euFilter','search'].forEach(id=>$('#'+id).addEventListener('input',renderTable));
renderTable();
$('#leadForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const payload={email:$('#leadEmail').value.trim(),goal:$('#goal').value.trim(),priority:$('#priority').value,eu:$('#eu').value};
  $('#leadStatus').textContent='Bezig met opslaan…';
  try{
    const r=await fetch('/api/ai-model-advisor-lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    if(!r.ok)throw new Error('lead');
    $('#leadStatus').innerHTML='Opgeslagen. <a href="https://www.bedrijfsgeheugen.nl/frisse-blik" style="color:#ffe86b">Ga door naar de Frisse Blik →</a>';
  }catch{
    $('#leadStatus').textContent='Opslaan lukte niet. Je kunt wel direct doorgaan naar de Frisse Blik.';
  }
});