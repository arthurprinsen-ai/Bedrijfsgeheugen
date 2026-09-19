export const RESOURCE_ANALYTICS_METRICS=Object.freeze([
  ['cost','Kosten','€'],['co2eKg','CO₂e','kg'],['waterLiters','Water','L'],['energyKwh','Energie','kWh'],
  ['tokens','Tokens','tokens'],['credits','Credits','credits'],['requests','Requests','requests']
]);

const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):null;
const lower=value=>String(value??'').trim().toLowerCase();

export function normalizeResourceDaily(rows=[]){
  return arr(rows).map(row=>({
    day:String(row?.day||'').slice(0,10),
    tenantId:String(row?.tenant_id||row?.tenantId||''),
    provider:String(row?.provider||'onbekend'),
    resourceType:String(row?.resource_type||row?.resourceType||'onbekend'),
    unit:String(row?.unit||''),
    usageEvents:num(row?.usage_events??row?.usageEvents),
    resourceAmount:num(row?.resource_amount??row?.resourceAmount),
    factorCoverage:num(row?.factor_coverage??row?.factorCoverage),
    energyKwh:num(row?.energy_kwh??row?.energyKwh),
    co2eKg:num(row?.co2e_kg??row?.co2eKg),
    waterLiters:num(row?.water_liters??row?.waterLiters),
    minFactorConfidence:num(row?.min_factor_confidence??row?.minFactorConfidence),
    provenanceComplete:(row?.provenance_complete??row?.provenanceComplete)===true
  })).filter(row=>row.day);
}

function metricValue(row,metric){
  const signature=`${lower(row.unit)} ${lower(row.resourceType)}`;
  if(metric==='tokens') return /token/.test(signature)?row.resourceAmount:null;
  if(metric==='credits') return /credit/.test(signature)?row.resourceAmount:null;
  if(metric==='cost') return /(eur|euro|cost|kosten)/.test(signature)?row.resourceAmount:null;
  if(metric==='requests') return /(request|call|api)/.test(signature)?(row.resourceAmount??row.usageEvents):row.usageEvents;
  return row?.[metric]??null;
}

function metricMeta(metric){
  return RESOURCE_ANALYTICS_METRICS.find(([id])=>id===metric)||RESOURCE_ANALYTICS_METRICS[1];
}
function fmt(value,unit){
  if(value==null||!Number.isFinite(Number(value)))return '—';
  const n=Number(value),digits=Math.abs(n)>=100?0:Math.abs(n)>=10?1:2;
  const valueText=n.toLocaleString('nl-NL',{maximumFractionDigits:digits});
  return unit==='€'?`€ ${valueText}`:`${valueText} ${unit}`.trim();
}
function esc(value=''){
  return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

export function buildResourceAnalyticsModel(data,filters={}){
  const rows=normalizeResourceDaily(data?.resourceIntelligence?.daily||[]);
  const metric=RESOURCE_ANALYTICS_METRICS.some(([id])=>id===filters.metric)?filters.metric:'co2eKg';
  const provider=filters.provider||'all';
  const resourceType=filters.resourceType||'all';
  const days=filters.days||'30';
  const maxDay=rows.map(r=>r.day).sort().at(-1)||'';
  const cutoff=maxDay&&days!=='all'
    ?new Date(new Date(maxDay+'T00:00:00Z').getTime()-(Number(days)-1)*86400000).toISOString().slice(0,10)
    :'';
  const filtered=rows.filter(row=>
    (provider==='all'||row.provider===provider) &&
    (resourceType==='all'||row.resourceType===resourceType) &&
    (!cutoff||row.day>=cutoff)
  );
  const dailyMap=new Map();
  for(const row of filtered){
    const value=metricValue(row,metric);
    if(value==null)continue;
    dailyMap.set(row.day,(dailyMap.get(row.day)||0)+value);
  }
  const daily=[...dailyMap].sort(([a],[b])=>a.localeCompare(b)).map(([day,value])=>({day,value}));
  const values=daily.map(x=>x.value);
  const total=values.length?values.reduce((a,b)=>a+b,0):null;
  const average=values.length?total/values.length:null;
  const latest=values.at(-1)??null;
  const previous=values.at(-2)??null;
  const deltaPct=latest!=null&&previous!=null&&previous!==0?((latest-previous)/Math.abs(previous))*100:null;
  const providerMap=new Map();
  for(const row of filtered){
    const value=metricValue(row,metric);
    if(value==null)continue;
    providerMap.set(row.provider,(providerMap.get(row.provider)||0)+value);
  }
  const providers=[...providerMap].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  return {rows,filtered,daily,providers,total,average,latest,previous,deltaPct,metric,provider,resourceType,days,maxDay};
}

function lineSvg(points=[]){
  if(!points.length)return '<div class="csrd-analytics-empty">Nog geen meetpunten voor deze selectie.</div>';
  const width=760,height=220,pad=22,max=Math.max(...points.map(p=>p.value),1),min=Math.min(...points.map(p=>p.value),0),span=Math.max(max-min,1);
  const coords=points.map((p,i)=>({
    x:pad+(points.length===1?0:(i/(points.length-1))*(width-pad*2)),
    y:height-pad-((p.value-min)/span)*(height-pad*2),
    ...p
  }));
  const path=coords.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return `<svg class="csrd-trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trend geselecteerde resource">
    <path class="grid" d="M${pad} ${height-pad} H${width-pad} M${pad} ${height/2} H${width-pad} M${pad} ${pad} H${width-pad}"/>
    <path class="trend" d="${path}"/>
    ${coords.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3"><title>${esc(p.day)}: ${p.value}</title></circle>`).join('')}
  </svg><div class="csrd-chart-axis"><span>${esc(points[0].day)}</span><span>${esc(points.at(-1).day)}</span></div>`;
}

export function resourceAnalyticsMarkup(data,filters={}){
  const model=buildResourceAnalyticsModel(data,filters);
  const [,label,unit]=metricMeta(model.metric);
  const providers=[...new Set(model.rows.map(r=>r.provider))].sort();
  const types=[...new Set(model.rows.map(r=>r.resourceType))].sort();
  const maxProvider=Math.max(...model.providers.map(x=>x.value),1);
  const qualityRows=model.filtered.filter(r=>r.factorCoverage!=null||r.provenanceComplete);
  const quality=qualityRows.length
    ?Math.round(qualityRows.reduce((sum,row)=>sum+(row.provenanceComplete?1:0),0)/qualityRows.length*100)
    :null;
  return `<section class="csrd-resource-dashboard" aria-label="Resource & Sustainability analytics">
    <div class="csrd-resource-head">
      <div><span class="csrd-kicker">Resource & Sustainability</span><h3>Kosten, AI-verbruik en milieu-impact door de tijd</h3><p>Filter op periode, provider en resource. Gemeten en berekende waarden blijven herleidbaar naar de canonieke resource-ledger.</p></div>
      <div class="csrd-resource-filters">
        <label>Metric<select data-resource-filter="metric">${RESOURCE_ANALYTICS_METRICS.map(([id,name])=>`<option value="${id}" ${id===model.metric?'selected':''}>${name}</option>`).join('')}</select></label>
        <label>Periode<select data-resource-filter="days">${[['7','7 dagen'],['30','30 dagen'],['90','90 dagen'],['all','Alles']].map(([id,name])=>`<option value="${id}" ${id===model.days?'selected':''}>${name}</option>`).join('')}</select></label>
        <label>Provider<select data-resource-filter="provider"><option value="all">Alle providers</option>${providers.map(x=>`<option value="${esc(x)}" ${x===model.provider?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
        <label>Resource<select data-resource-filter="resourceType"><option value="all">Alle resources</option>${types.map(x=>`<option value="${esc(x)}" ${x===model.resourceType?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
      </div>
    </div>
    <div class="csrd-resource-kpis">
      <article><small>${label} totaal</small><strong>${fmt(model.total,unit)}</strong><span>${model.daily.length} dagen met meetdata</span></article>
      <article><small>Dag-gemiddelde</small><strong>${fmt(model.average,unit)}</strong><span>eigen benchmark geselecteerde periode</span></article>
      <article><small>Laatste meetdag</small><strong>${fmt(model.latest,unit)}</strong><span>${model.deltaPct==null?'geen vorige meetdag':`${model.deltaPct>0?'+':''}${model.deltaPct.toFixed(1)}% vs vorige meetdag`}</span></article>
      <article><small>Provenance compleet</small><strong>${quality==null?'—':quality+'%'}</strong><span>evidence-deking van selectie</span></article>
    </div>
    <div class="csrd-resource-grid">
      <article class="csrd-panel csrd-trend-panel"><div class="csrd-panelhead"><h3>${label} per dag</h3><span>${model.provider==='all'?'alle providers':esc(model.provider)} · ${model.resourceType==='all'?'alle resources':esc(model.resourceType)}</span></div>${lineSvg(model.daily)}</article>
      <article class="csrd-panel csrd-provider-panel"><div class="csrd-panelhead"><h3>Verdeling per provider</h3><span>${label}</span></div><div class="csrd-provider-bars">${model.providers.length?model.providers.slice(0,8).map(x=>`<div><span>${esc(x.name)}</span><i style="--w :${Math.max(2,x.value/maxProvider*100)}%"></i><b>${fmt(x.value,unit)}</b></div>`).join(''):'<p>Nog geen providerdata voor deze selectie.</p>'}</div></article>
    </div>
    <div class="csrd-benchmark-strip">
      <span><b>Benchmark:</b> eigen periodegemiddelde ${fmt(model.average,unit)}</span>
      <span><b>Intensiteit:</b> kies tokens, credits of requests als digitale werkeenheid. SCI/SEI/SWI-ratio’s verschijnen pas zodra de functionele eenheid en factor-evidence aantoonbaar beschikbaar zijn.</span>
      <button type="button" data-resource-sector-benchmark>Open sectorbenchmark →</button>
    </div>
  </section>`;
}
