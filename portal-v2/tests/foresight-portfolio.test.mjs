import test from 'node:test';
import assert from 'node:assert/strict';
import {buildForesightPortfolio,renderForesightPortfolio} from '../foresight-portfolio.js';
import {buildForesightStudioModel} from '../foresight-scenario-studio.js';

const asOf='2026-10-15T00:00:00Z';
const observed=Date.parse(asOf);
const history=(values,source='erp')=>values.map((v,i)=>({
  date:'2026-0'+(6+i)+'-01',value:v,source,evidenceRef:source+':'+i
}));
const data={portal:{
  business_context:{goal_targets:{
    revenue_growth:{target_value:20,target_date:'2027-02-01',history:history([2,4,6,8])},
    automate:{target_value:100,target_date:'2027-02-01',history:history([250,230,220,210],'hr')}
  }}
}};

test('zero-observation tenants get no invented domain forecasts or scenario values',()=>{
 const a=buildForesightPortfolio(buildForesightStudioModel({}, {asOf}),null,{now:observed});
 assert.equal(a.available,0);
 assert.equal(a.missing,7);
 assert.equal(a.rows.length,7);
 assert.ok(a.rows.every(r=>!r.hasTrend&&r.base===null&&r.optimistic===null));
 assert.match(renderForesightPortfolio(a),/Geen getalsmatige verwachting/);
});

test('each domain has independent baseline and correctly directed favorable/downside paths',()=>{
 const model=buildForesightStudioModel(data,{asOf,metric:'revenue_growth',days:90,sensitivity:15});
 const portfolio=buildForesightPortfolio(model,null,{now:observed});
 const revenue=portfolio.rows.find(r=>r.id==='revenue_growth');
 const capacity=portfolio.rows.find(r=>r.id==='automate');
 assert.equal(portfolio.sensitivity,15);
 assert.equal(portfolio.available,2);
 assert.ok(revenue.optimistic>revenue.base);
 assert.ok(revenue.pessimistic<revenue.base);
 assert.ok(capacity.optimistic<capacity.base);
 assert.ok(capacity.pessimistic>capacity.base);
 assert.equal(revenue.historyCount,4);
 assert.equal(revenue.sourceRefs,4);
 assert.ok(portfolio.rows.filter(r=>!r.hasTrend).length===5);
});

test('no financial aggregation across incommensurate business metrics',()=>{
 const portfolio=buildForesightPortfolio(buildForesightStudioModel(data,{asOf}),null,{now:observed});
 assert.equal('totalForecast' in portfolio,false);
 assert.match(portfolio.caveat,/geen doorgerekende onderlinge beïnvloeding/);
 const html=renderForesightPortfolio(portfolio,{open:true});
 assert.match(html,/<table>/);
 assert.match(html,/data-pfs-compare-metric="automate"/);
 assert.match(html,/data-pfs-open-page="bedrijfssituatie"/);
 assert.match(html,/data-pfs-portfolio/);
});

test('negative baselines and down-metrics use absolute magnitude with goal direction',()=>{
 const model={scenario:{sensitivity:10},metrics:[
  {id:'profit',label:'Profit',domain:'Financiën',direction:'up',unit:'%',forecast:{expected:-8,forecastFor:'2027-01-01'},history:[],current:-9},
  {id:'resilience',label:'Risico',domain:'Risico',direction:'down',unit:'%',forecast:{expected:-10,forecastFor:'2027-01-01'},history:[],current:-8}
 ]};
 const portfolio=buildForesightPortfolio(model,null,{now:observed});
 assert.equal(portfolio.rows[0].optimistic,-7.2);
 assert.equal(portfolio.rows[0].pessimistic,-8.8);
 assert.equal(portfolio.rows[1].optimistic,-11);
});

test('untrusted, unobserved or stale heartbeat input never becomes live SLA proof',()=>{
 const model=buildForesightStudioModel(data,{asOf});
 for(const runtime of [
    {observability:{source:'fake-heartbeat',updatedAt:asOf,events:[{id:'bad'}]}},
    {observability:{source:'brain-operating-loop',updatedAt:'2026-01-01T00:00:00Z',events:[{id:'old'}]}}
 ]){
   const a=buildForesightPortfolio(model,runtime,{now:observed});
   assert.equal(a.runtime.state,'NOT_EVIDENCED');
   assert.equal(a.runtime.events,0);
 }
 const observedRuntime={
  observability:{source:'brain-operating-loop',updatedAt:asOf,events:[{id:'e1'},{id:'e2'}]},
  sources:{items:[{status:'aandacht'},{status:'ok'}]},
  actions:{items:[{id:'a1'}]}
 };
 const p=buildForesightPortfolio(model,observedRuntime,{now:observed});
 assert.equal(p.runtime.state,'OBSERVED_RECENT');
 assert.equal(p.runtime.explicitAttention,1);
 assert.equal(p.runtime.events,2);
 assert.match(renderForesightPortfolio(p),/geen voorspelling/);
});

test('source and goal text is escaped before HTML rendering',()=>{
 const p=buildForesightPortfolio({metrics:[{
  id:'"><img src=x onerror=alert(1)>',label:'<svg onload=alert(2)>',
  domain:'<b>evil</b>',unit:'%',history:[],evidenceCount:0,
  quality:'none'
 }]},null,{now:observed});
 const html=renderForesightPortfolio(p,{open:true});
 assert.doesNotMatch(html,/<svg onload=|<img src=/);
 assert.match(html,/&lt;svg/);
 assert.match(html,/&lt;b&gt;evil/);
});
