// Context-aware forecasting panel. Never infer future values from unrelated KPI scores.
const clean = x => String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = x => x !== '' && x !== null && x !== undefined && Number.isFinite(Number(x)) ? Number(x) : null;
const allowed = ['revenue','cashflow','margin','customers','capacity','risk','goal','custom'];
const labels = {revenue:'Omzet',cashflow:'Liquiditeit',margin:'Marge',customers:'Klanten',capacity:'Capaciteit',risk:'Risico',goal:'Strategisch doel',custom:'Prognose'};
const relevant = {
  today:['revenue','cashflow','margin','goal','customers'],
  company:['revenue','cashflow','margin','capacity'],
  intelligence:['risk','customers','revenue'],
  decisions:['revenue','cashflow','margin','risk'],
  execution:['capacity','goal','cashflow'],
  impact:['revenue','margin','cashflow','goal'],
  memory:['goal','revenue'],
  admin:['cashflow','capacity']
};
let selected='auto',horizon=6,adjustment=0;
const points = data => Array.isArray(data) ? data.map(p=>({date:String(p?.date??p?.period??''),value:number(p?.value)})).filter(p=>p.date&&p.value!==null).slice(0,48) : [];
function datasets(state){
  const raw=Array.isArray(state?.forecasts)?state.forecasts:Array.isArray(state?.predictions)?state.predictions:[];
  return raw.filter(x=>x&&typeof x==='object').map(x=>({
    id:String(x.id??x.metric??'custom'),metric:allowed.includes(x.metric)?x.metric:'custom',
    title:String(x.title||labels[x.metric]||'Prognose'),unit:String(x.unit||''),
    history:points(x.history),future:points(x.forecast??x.baseline),
    low:points(x.low??x.lower),high:points(x.high??x.upper),
    updatedAt:x.updatedAt||null,source:x.source||null,model:x.model||null,
    verified:x.verified===true && Boolean(x.source) && Boolean(x.updatedAt),
  })).filter(x=>x.history.length&&x.future.length&&x.future.every(p=>p.value!==null));
}
const format=(n,unit)=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(n)+(unit?' '+clean(unit):'');
function chart(d){
  const past=d.history.slice(-6),future=d.future.slice(0,horizon);
  const joined=[...past,...future],values=joined.map(x=>x.value);
  if(d.low.length&&d.high.length){values.push(...d.low.slice(0,horizon).map(x=>x.value),...d.high.slice(0,horizon).map(x=>x.value))}
  const min=Math.min(...values),max=Math.max(...values),span=Math.max(1,max-min);
  const x=i=>36+i* (640/Math.max(1,joined.length-1));
  const y=v=>178-(v-min)/span*145;
  const line=(p,offset=0,scale=1)=>p.map((v,i)=>[x(i+offset),y(v.value*scale)].join(',')).join(' ');
  const base=past.at(-1)?.value??future[0].value;
  const projected=[{date:past.at(-1)?.date||'',value:base},...future];
  const multiplier=1+adjustment/100;
  const band=(d.low.length>=future.length&&d.high.length>=future.length)?'<polygon points="'+
    [...[{value:base},...d.high.slice(0,horizon)].map((v,i)=>[x(past.length-1+i),y(v.value)]),
      ...[{value:base},...d.low.slice(0,horizon)].map((v,i)=>[x(past.length-1+i),y(v.value)]).reverse()]
      .map(p=>p.join(',')).join(' ')+'" fill="#bfd1fc" opacity=".35"/>':'';
  const simulated=adjustment!==0?'<polyline points="'+line([{value:base},...future],past.length-1,multiplier)+'" fill="none" stroke="#a65de2" stroke-width="2.5" stroke-dasharray="6 4"/>':'';
  return '<svg viewBox="0 0 720 205" role="img" aria-label="Historische waarden en prognose voor '+clean(d.title)+'">'+
    '<line x1="36" y1="178" x2="684" y2="178" stroke="#ccd3e3"/>'+
    band+'<polyline points="'+line(past)+'" fill="none" stroke="#1557ff" stroke-width="3"/>'+
    '<polyline points="'+line(projected,past.length-1)+'" fill="none" stroke="#159b75" stroke-width="3" stroke-dasharray="7 4"/>'+
    simulated+'<line x1="'+x(past.length-1)+'" y1="17" x2="'+x(past.length-1)+'" y2="178" stroke="#a9b2c7" stroke-dasharray="3 5"/>'+
    '<text x="36" y="194" font-size="11" fill="#66718f">'+clean(joined[0]?.date)+'</text>'+
    '<text x="684" y="194" text-anchor="end" font-size="11" fill="#66718f">'+clean(joined.at(-1)?.date)+'</text></svg>';
}
export function renderForecastPanel(state,route){
  const top=String(route||'today').split('/')[0],data=datasets(state);
  const ordered=[...(relevant[top]||[]),'custom'];
  const visible=data.filter(x=>ordered.includes(x.metric));
  const chosen=visible.find(x=>x.id===selected)||visible[0];
  const heading=top==='today'?'Jouw onderneming vooruit':'Voorspellingen in deze context';
  if(!chosen)return '<section class="forecast-panel card" aria-label="Voorspellende intelligentie"><div class="forecast-head"><div><span class="forecast-eyebrow">POWERHOUSE · PREDICTIVE INTELLIGENCE</span><h2>'+heading+'</h2><p>Er zijn nog geen onderbouwde prognoses gekoppeld voor deze pagina. Verbind historische metingen, modeluitkomsten, bron en peildatum om scenario’s te tonen.</p></div><span class="forecast-status">Nog geen geverifieerde voorspelling</span></div><div class="forecast-empty">Geen grafiek met fictieve bedrijfsgetallen. Bekijk beschikbare bronnen en modelvalidatie bij de intelligence- en beheerfuncties.</div></section>';
  const f=chosen.future.slice(0,horizon),last=f.at(-1)?.value;
  const quality=chosen.verified?'Bron en peildatum geregistreerd':'Niet geverifieerd · uitsluitend indicatief';
  return '<section class="forecast-panel card" aria-label="Interactieve voorspellingen"><div class="forecast-head"><div><span class="forecast-eyebrow">POWERHOUSE · PREDICTIVE INTELLIGENCE</span><h2>'+heading+'</h2><p>Historie, prognose, onzekerheid en scenario-impact. Verschuivingen zijn verkenningen, geen modelvoorspellingen.</p></div><span class="forecast-status">'+quality+'</span></div>'+
  '<div class="forecast-controls"><label>Onderwerp <select data-forecast="metric">'+visible.map(d=>'<option value="'+clean(d.id)+'" '+(d.id===chosen.id?'selected':'')+'>'+clean(d.title)+'</option>').join('')+'</select></label>'+
  '<label>Horizon <select data-forecast="horizon">'+[3,6,12].map(n=>'<option value="'+n+'" '+(horizon===n?'selected':'')+'>'+n+' perioden</option>').join('')+'</select></label>'+
  '<label>Scenario-aanpassing <input data-forecast="adjustment" type="range" min="-20" max="20" step="5" value="'+adjustment+'"/><strong>'+ (adjustment>0?'+':'')+adjustment+'%</strong></label></div>'+
  '<div class="forecast-visual">'+chart(chosen)+'</div><div class="forecast-legend"><span>━ Historie</span><span>┄ Modelprognose</span>'+(adjustment?'<span>┄ Wat-als-scenario</span>':'')+(chosen.low.length&&chosen.high.length?'<span>▧ Onzekerheidsband</span>':'')+'</div>'+
  '<div class="forecast-results"><div><small>Laatste prognosepunt</small><strong>'+format(last,chosen.unit)+'</strong></div><div><small>Wat-als bij '+adjustment+'%</small><strong>'+format(last*(1+adjustment/100),chosen.unit)+'</strong></div><div><small>Herkomst en model</small><strong>'+clean(chosen.source||'Bron ontbreekt')+'</strong><small>'+clean(chosen.model||'Model onbekend')+' · '+clean(chosen.updatedAt||'Geen peildatum')+'</small></div></div>'+
  '<p class="forecast-disclaimer">Scenario-aanpassing is rekenkundig, geen causale voorspelling. De actualiteit, onzekerheidsmarges en nauwkeurigheid moeten op bron- en modelniveau worden geverifieerd.</p></section>';
}
export function bindForecastControls(root,refresh){
  root.querySelectorAll('[data-forecast]').forEach(el=>el.addEventListener('input',e=>{
    const k=e.currentTarget.dataset.forecast,v=e.currentTarget.value;
    if(k==='metric')selected=v;
    if(k==='horizon')horizon=Number(v);
    if(k==='adjustment')adjustment=Number(v);
    refresh();
  }));
}
