import {
 buildValueDriverGraph,
 managementAccountingDataGaps,
 MANAGEMENT_ACCOUNTING_SOURCES
} from '../../brain/economics/management-accounting-intelligence.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)||0);
const number=(value,digits=1)=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(Number(value)||0);
const metricFormat=item=>{
 if(!item)return '—';
 if(item.unit==='percent')return number(item.value,1)+'%';
 if(item.unit==='currency'||item.unit==='currency_per_fte'||item.unit==='currency_per_hour')return euro(item.value);
 if(item.unit==='days')return number(item.value,1)+' d';
 if(item.unit==='multiple')return number(item.value,2)+'×';
 if(item.unit==='number_per_fte')return number(item.value,1);
 return number(item.value,1);
};
const metricBenchmark=item=>{
 if(item?.benchmark==null)return '';
 const formatted=metricFormat({...item,value:item.benchmark});
 return '<small class="ma-benchmark">benchmark '+esc(formatted)+(item.benchmark_source?' · '+esc(item.benchmark_source):'')+'</small>';
};
function ensureStyles(doc){
 if(doc.getElementById('management-accounting-intelligence-style'))return;
 const style=doc.createElement('style');style.id='management-accounting-intelligence-style';style.textContent=`
 .ma-intel{margin:18px 0;padding:18px;border:1px solid #dfe5ef;border-radius:20px;background:linear-gradient(180deg,#fff,#f8fafc)}
 .ma-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.ma-head h3{margin:3px 0 5px;font-size:22px;color:#0f172a}.ma-head p{margin:0;color:#64748b;line-height:1.5;max-width:760px}.ma-badge{font-size:11px;font-weight:800;padding:7px 9px;border-radius:999px;background:#eef2ff;color:#3730a3;white-space:nowrap}
 .ma-graph{display:grid;grid-template-columns:repeat(8,minmax(120px,1fr));gap:8px;overflow:auto;padding:3px 0 10px}.ma-node{min-width:120px;padding:11px;border:1px solid #e2e8f0;border-radius:14px;background:white}.ma-node b{display:block;font-size:12px;color:#0f172a}.ma-node small{display:block;color:#64748b;margin-top:4px}.ma-arrow{display:none}
 .ma-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:10px 0}.ma-kpi{padding:13px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}.ma-kpi small{display:block;color:#64748b;font-size:11px}.ma-kpi strong{display:block;font-size:22px;margin:3px 0;color:#0f172a}.ma-benchmark{color:#475569!important;line-height:1.35}
 .ma-levers{display:grid;grid-template-columns:1.15fr .85fr;gap:12px}.ma-card{padding:15px;border:1px solid #e2e8f0;border-radius:16px;background:#fff}.ma-card h4{margin:0 0 10px;color:#0f172a}.ma-lever{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px 0;border-top:1px solid #eef2f7}.ma-lever:first-of-type{border-top:0}.ma-lever b{font-size:13px}.ma-lever small{display:block;color:#64748b;margin-top:3px;line-height:1.4}.ma-impact{text-align:right}.ma-impact strong{font-size:13px}.ma-effort{display:block;color:#64748b;font-size:11px}
 .ma-matrix{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ma-matrix article{padding:10px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0}.ma-matrix small{display:block;color:#64748b}.ma-matrix strong{display:block;margin-top:3px;font-size:14px}
 .ma-gaps{margin-top:10px;padding:10px 12px;border-radius:12px;background:#fff7ed;color:#9a3412;font-size:12px;line-height:1.5}.ma-sources{margin-top:10px}.ma-sources summary{cursor:pointer;font-size:12px;color:#475569}.ma-sources ul{font-size:12px;color:#64748b;line-height:1.5}
 @media(max-width:980px){.ma-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.ma-levers{grid-template-columns:1fr}}
 @media(max-width:620px){.ma-intel{padding:14px}.ma-head{display:block}.ma-badge{display:inline-block;margin-top:8px}.ma-kpis{grid-template-columns:1fr}.ma-graph{grid-template-columns:repeat(8,150px)}}
 `;doc.head.appendChild(style);
}
const preferred=['revenue_per_employee','gross_profit_per_employee','ebitda_margin_pct','absence_pct','dso_days','cash_conversion_cycle_days','net_debt_to_ebitda','enterprise_value'];
function topMetrics(graph){
 const map=new Map(graph.metrics.map(item=>[item.id,item]));
 const ordered=preferred.map(id=>map.get(id)).filter(Boolean);
 for(const item of graph.metrics)if(!ordered.includes(item)&&ordered.length<8)ordered.push(item);
 return ordered.slice(0,8);
}
function leverMarkup(item){
 const impact=item.expected_value==null?'Nog niet gekwantificeerd':euro(item.expected_value);
 const type=({working_capital_release:'werkkapitaal',annual_gross_profit_potential:'brutowinstpotentieel',annual_ebitda_potential:'EBITDA-potentieel',capacity_value:'capaciteitswaarde'})[item.value_type]||'potentieel';
 return '<div class="ma-lever"><div><b>'+esc(item.title)+'</b><small>'+esc(item.metric_id)+' · nu '+number(item.current,1)+' · benchmark '+number(item.benchmark,1)+(item.benchmark_source?' · '+esc(item.benchmark_source):'')+'</small></div><div class="ma-impact"><strong>'+esc(impact)+'</strong><span class="ma-effort">'+esc(type)+' · effort '+item.effort_score+'/100</span></div></div>';
}
export function managementAccountingMarkup(state={}){
 const graph=buildValueDriverGraph(state);
 const metrics=topMetrics(graph);
 const gaps=managementAccountingDataGaps(state);
 const nodeMarkup=graph.nodes.map(node=>'<article class="ma-node"><b>'+esc(node.label)+'</b><small>'+node.metrics.length+' meetbaar</small></article>').join('');
 const kpis=metrics.length?metrics.map(item=>'<article class="ma-kpi"><small>'+esc(item.label)+'</small><strong>'+esc(metricFormat(item))+'</strong>'+metricBenchmark(item)+'</article>').join(''):'<article class="ma-kpi"><small>Data</small><strong>—</strong><span>Vul bedrijfsdata in om de waardedrivers te berekenen.</span></article>';
 const levers=graph.roadmap.slice(0,6);
 const matrix=levers.slice(0,4).map(item=>'<article><small>Impact / effort</small><strong>'+esc(item.title)+'</strong><span>'+String(Math.round(item.priority_score))+' prioriteit · '+item.effort_score+' effort</span></article>').join('');
 const gapText=gaps.length?'Nog nodig voor een rijker beeld: '+gaps.slice(0,7).map(item=>item.label).join(', ')+(gaps.length>7?'…':''):'De kernset is voldoende gevuld voor een brede management-accounting analyse.';
 return '<section class="ma-intel" data-management-accounting-intelligence>'+
 '<div class="ma-head"><div><small>Powerhouse · management accounting & ondernemingswaarde</small><h3>Van medewerker en proces naar cash en bedrijfswaarde</h3><p>Productiviteit, mensen, operatie, commercie, marge, werkkapitaal en waardering worden als één value-driver graph gelezen. Alleen ingevoerde klantdata en expliciete benchmarks worden als feiten gebruikt.</p></div><span class="ma-badge">Evidence-first</span></div>'+
 '<div class="ma-graph" aria-label="Value driver graph">'+nodeMarkup+'</div>'+
 '<div class="ma-kpis">'+kpis+'</div>'+
 '<div class="ma-levers"><section class="ma-card"><h4>Grootste hefbomen → roadmap</h4>'+(levers.length?levers.map(leverMarkup).join(''):'<p>Voeg branchebenchmarks toe om concrete afwijkingen automatisch naar roadmapacties met impact en effort te vertalen.</p>')+'</section>'+
 '<section class="ma-card"><h4>Impact × effort</h4><div class="ma-matrix">'+(matrix||'<p>Nog geen benchmarkgedreven roadmapkandidaten.</p>')+'</div><div class="ma-gaps">'+esc(gapText)+'</div></section></div>'+
 '<details class="ma-sources"><summary>Onderbouwing & bronfamilies</summary><ul>'+MANAGEMENT_ACCOUNTING_SOURCES.map(source=>'<li><b>'+esc(source.label)+'</b> — '+esc(source.use)+'</li>').join('')+'</ul></details>'+
 '</section>';
}
export function renderManagementAccountingIntelligence(root=document,state={}){
 const main=root?.querySelector?.('.main');if(!main)return false;
 const doc=root.ownerDocument||document;ensureStyles(doc);
 let section=main.querySelector('[data-management-accounting-intelligence]');
 const html=managementAccountingMarkup(state);
 if(section){const holder=doc.createElement('div');holder.innerHTML=html;section.replaceWith(holder.firstElementChild);return true;}
 const holder=doc.createElement('div');holder.innerHTML=html;section=holder.firstElementChild;
 const anchor=main.querySelector('[data-business-journey-overview]')||main.querySelector('[data-legacy-overview-insights]')||main.querySelector('.dashboard');
 if(anchor?.parentNode===main)anchor.after(section);else main.appendChild(section);
 return true;
}
