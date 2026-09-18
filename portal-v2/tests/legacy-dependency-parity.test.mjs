import test from 'node:test';
import assert from 'node:assert/strict';
import { allPageIds } from '../page-registry.js';
import { LEGACY_FUNCTIONAL_INVENTORY } from '../legacy-functional-inventory.js';
import { LEGACY_CAPABILITY_MAP } from '../legacy-parity.js';
import { dependencyEdges, CRITICAL_DEPENDENCY_CHAINS } from '../legacy-dependency-contract.js';
import { calculateLegacyEquivalent as calc } from '../legacy-parity-engine.js';
import { brancheVergelijking } from '../external-data.js';
import { pageMetrics, pageWorklist, hasPageData } from '../page-metrics.js';

test('every legacy dependency resolves to a real native V2 page',()=>{
  const pages=new Set(allPageIds());
  for(const [legacy,item] of Object.entries(LEGACY_FUNCTIONAL_INVENTORY)){
    assert.ok(pages.has(item.v2Page),legacy+' source');
    for(const dependency of item.dependencies){
      const target=LEGACY_CAPABILITY_MAP[dependency]||dependency;
      assert.ok(pages.has(target),legacy+' -> '+dependency+' -> '+target);
    }
  }
  assert.ok(dependencyEdges().length>40);
});

test('critical old-portal chains remain contiguous in V2',()=>{
  const edges=new Set(dependencyEdges().map(e=>e.source+'>'+e.target));
  for(const chain of CRITICAL_DEPENDENCY_CHAINS){
    for(let i=0;i<chain.length-1;i++){
      const direct=edges.has(chain[i]+'>'+chain[i+1]);
      const reverse=edges.has(chain[i+1]+'>'+chain[i]);
      assert.ok(direct||reverse,chain[i]+' <-> '+chain[i+1]);
    }
  }
});

test('profile maturity and workforce propagate to overview businesscase and capability economics',()=>{
  const base={portal:{profile:{employees:24,hourlyCost:50,maturity:{sturing:2,commercie:2,operatie:2,finance:2,mensen:2,analytics:2,quality:2,governance:2,tech:2,culture:2,service:2,security:2,duurzaam:2}},businessCase:{target:4,delay:6,investment:10000}}};
  const better=structuredClone(base); better.portal.profile.maturity.operatie=4;
  assert.notEqual(calc('manual-work-annual',base),calc('manual-work-annual',better));
  assert.notEqual(calc('benefit-at-target-maturity',base),calc('benefit-at-target-maturity',better));
  assert.notEqual(calc('dimension-cost-total',base),calc('dimension-cost-total',better));
});

test('company figures propagate into financing and exit value',()=>{
  const a={portal:{metrics:{revenue:1000000,ebitda:100000,grossMargin:40},valueFinance:{multiple:5,debt:100000,cash:50000,balance:800000,equity:300000,fixed:200000,interest:10000},dueDiligence:{findings:[]}}};
  const b=structuredClone(a); b.portal.metrics.ebitda=150000;
  assert.notEqual(calc('enterprise-value',a),calc('enterprise-value',b));
  assert.notEqual(calc('equity-value',a),calc('equity-value',b));
});

test('people metrics are interpreted against the selected branch',()=>{
  const metrics={absence:5,turnover:15,enps:10};
  const ict=brancheVergelijking(metrics,'ICT & software');
  const zorg=brancheVergelijking(metrics,'Zorg');
  assert.notDeepEqual(ict,zorg);
});

test('strategy canvases compliance and roadmap feed the final synthesis and overview progress',()=>{
  const state={portal:{
    profile:{employees:24,hourlyCost:50,maturity:{sturing:3,commercie:3,operatie:3,finance:3,mensen:3,analytics:3,quality:3,governance:3,tech:3,culture:3,service:3,security:3,duurzaam:3}},
    strategy:{findings:[{finding:'x',value:25000,horizon:3}],minimumValue:0,horizon:12},
    canvases:{bmc:{answer:'x',owner:'A'}},
    compliance:{policies:{0:'vastgesteld',1:'geoefend'},esg:{0:2,1:3}},
    aiCapabilities:{a:3,b:4},
    roadmap:{items:[{title:'x',progress:20,done:false},{title:'y',progress:100,done:true}]}
  }};
  const synthesis=calc('final-synthesis',state);
  assert.equal(synthesis.value,25000);
  assert.ok(synthesis.consensus>0);
  assert.ok(Number.isFinite(synthesis.risk));
  assert.equal(calc('progress',state),60);
  assert.equal(hasPageData('eindconclusie',state),true);
  assert.ok(pageMetrics('eindconclusie',state).some(([,v])=>v!=='—'));
});

test('research preserves both external evidence and maturity-cost context',()=>{
  const state={portal:{profile:{employees:24,hourlyCost:50,maturity:{sturing:2,commercie:2,operatie:2,finance:2,mensen:2,analytics:2,quality:2,governance:2,tech:2,culture:2,service:2,security:2,duurzaam:2}},research:{hypotheses:[{hypothesis:'x'}]}}};
  const rows=pageWorklist('onderzoek',state);
  assert.ok(rows.some(([label])=>/volwassenheid|kosten/i.test(label)));
  assert.ok(rows.some(([label])=>/AI|data|pilots|uitgaven|agent/i.test(label)));
});
