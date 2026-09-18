import test from 'node:test';
import assert from 'node:assert/strict';
import { upgradeLegacyPortalState, hasLegacyPortalData } from '../legacy-state-migration.js';

const legacy={
  niveaus:{finance:1,tech:2,mensen:3},
  mw:24,uur:52,branche:'Zakelijke dienstverlening',omzet:1500000,
  mensen:{mVerzuim:'3.4',mVerloop:'12',mEnps:'20',mMto:'3',mVac:'2'},
  cijfers:{cOmzet:'1500',cBrutomarge:'45',cEbitda:'180',cLoon:'600',cKlanten:'100',cGrootste:'15',cMarketing:'60',cNieuw:'20',cDso:'34',cIt:'40'},
  bc:{bDoel:'4',bUitstel:'6',bInvest:'12'},
  fin:{wSchuld:'200',wCash:'50',wEV:'400',wBalans:'900',wVast:'500',wRente:'25',wMultiple:'5',wWacc:'10'},
  prod:{pDeclarabel:'72',pOtif:'91',pFout:'3',pDoorloop:'8',pOrders:'420',pOfferte:'37',pOpleiding:'20',pVerloopKlant:'7'},
  kto:{kNps:'34',kTevreden:'8.2',kHerhaal:'64',kKlacht:'3'},
  metingen:[{id:1,d:'2026-09-01',s:'NPS',v:34,n:'na wijziging'}],
  taken:[{id:2,t:'Finance automatiseren',dim:'finance',s:2,d:3,klaar:true}],
  eigen:{bmc:'mkb productie',vpc2:'zekerheid',lean:'doorlooptijd',merk:'betrouwbaarheid',content:'hoe sneller?',sales2:'Concurrent X op prijs'},
  beleid:{infosec:3,toegang:2,incident:1,backup:3,avg:2,verwerker:2,aibeleid:1,datadef:2,rapport:3,leverancier:1,csrd:1,continu:2},
  esg:{energie:2,co2:1,afval:2,water:0,vervoer:2,arbo:3,divers:1,opleiding:2,keten:1,ethiek:2,bestuur:3},
  aicap:{'strategie-01':4},aicapUitScan:{'strategie-01':true},aicapStempel:12,aicapDatum:'2026-09-01',
  modellen:{swot:true,bcg:false},uitvoering:{finance:{0:true,1:false}},eigenCaps:{eigen_1:{n:'Onderhoud',dim:'operatie'}},
  beheer:{finance:{wie:'Controller',op:'2026-08-01'}},besluiten:[{wat:'Nieuw ERP',waarom:'groei'}],
  docs:[{naam:'Proceshandboek',bij:'operatie',op:'2026-07-01'}],log:[{wat:'Proces aangepast',datum:'2026-08-01',door:'MT',raakt:'operatie'}],
  wijz:[{change:'ERP live',area:'tech',impact:4,status:'Geborgd'}],dd:{vink:{jaarrekening:true}},
  scanStempel:99,scanDatum:'2026-08-20',scanScore:61
};

test('raw saved legacy state is detected even without flattened form ids',()=>assert.equal(hasLegacyPortalData(legacy),true));

test('all persisted legacy state families migrate into canonical Portal V2 paths',()=>{
 const out=upgradeLegacyPortalState(legacy).portal;
 assert.deepEqual(out.profile.maturity,legacy.niveaus);
 assert.equal(out.profile.employees,24);assert.equal(out.profile.hourlyCost,52);
 assert.equal(out.market.industry,'Zakelijke dienstverlening');
 assert.equal(out.people.absence,3.4);assert.equal(out.people.mto,3);
 assert.equal(out.metrics.revenue,1500);assert.equal(out.metrics.satisfaction,8.2);
 assert.equal(out.metrics.performance.onTime,91);
 assert.deepEqual(out.metrics.measurements[0],{id:'1',date:'2026-09-01',type:'NPS',value:34,note:'na wijziging'});
 assert.equal(out.businessCase.investment,12000);
 assert.equal(out.roadmap.items[0].title,'Finance automatiseren');assert.equal(out.roadmap.items[0].done,true);
 assert.equal(out.canvases.sales2.answer,'Concurrent X op prijs');
 assert.equal(out.compliance.policies.length,12);assert.equal(out.compliance.policies[0],'geoefend');
 assert.equal(out.compliance.esg.length,11);assert.equal(out.compliance.esgByKey.bestuur,3);
 assert.equal(out.aiCapabilities['strategie-01'],4);assert.equal(out.aiCapabilitySources['strategie-01'],true);
 assert.equal(out.execution.completed.finance[0],true);
 assert.equal(out.strategy.customCapabilities.eigen_1.n,'Onderhoud');
 assert.equal(out.freshness.decisions.length,1);assert.equal(out.freshness.documents.length,1);
 assert.equal(out.changes.history.length,1);assert.equal(out.changes.items.length,1);
 assert.equal(out.dueDiligence.dataRoomChecks.jaarrekening,true);
 assert.equal(out.profile.scan.score,61);
 assert.equal(out.migration.version,'2026-09-18-v4');
});

test('legacy migration never overwrites newer canonical V2 truth',()=>{
 const input={portal:{metrics:{revenue:2222}},...legacy};
 const out=upgradeLegacyPortalState(input);
 assert.equal(out.portal.metrics.revenue,2222);
});
