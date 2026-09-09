import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LEGACY_FUNCTIONAL_INVENTORY } from '../legacy-functional-inventory.js';
import { listCalculatorIds, calculateLegacyEquivalent, migrateLegacyState, parityCoverage } from '../legacy-parity-engine.js';
import { upgradeLegacyPortalState } from '../legacy-state-migration.js';
import { createDomainState } from '../domain-state.js';

const expected=[...new Set(Object.values(LEGACY_FUNCTIONAL_INVENTORY).flatMap(item=>item.calculations||[]))].sort();

test('every inventoried legacy calculation has executable V2 parity logic',()=>{
  assert.deepEqual(listCalculatorIds().sort(),expected);
  const coverage=parityCoverage();
  assert.equal(coverage.missing.length,0);
  assert.equal(coverage.total,expected.length);
});

test('legacy field state migrates to canonical portal slices without dropping representative data',()=>{
  const legacy={mw:18,uur:75,bDoel:4,bUitstel:3,bInvest:120000,cOmzet:2400,cEbitda:360,wSchuld:500,wCash:120,wEV:900,wBalans:1800,wRente:45,wMultiple:6,wWacc:9,asTarief:85,mVerzuim:4.2,mVerloop:11,mEnps:18,nTitel:'Kennis borgen',nDim:'Mensen',nStart:2,nDuur:4};
  const migrated=migrateLegacyState(legacy);
  assert.equal(migrated.portal.profile.manualHoursPerWeek,18);
  assert.equal(migrated.portal.profile.hourlyCost,75);
  assert.equal(migrated.portal.businessCase.target,4);
  assert.equal(migrated.portal.metrics.revenue,2400);
  assert.equal(migrated.portal.valueFinance.wacc,9);
  assert.equal(migrated.portal.aiScan.hourlyRate,85);
  assert.equal(migrated.portal.people.enps,18);
  assert.equal(migrated.portal.roadmap.draft.title,'Kennis borgen');
});

test('repeatable legacy collections and Strategy DNA migrate while canonical V2 values win',()=>{
  const upgraded=upgradeLegacyPortalState({legacy:{asRijen:[{task:'Facturen'}],ddInhoud:[{finding:'Concentratierisico'}],dnaVrij:'Groei zonder kennisverlies',beleidLijst:['vastgesteld']},portal:{aiScan:{hourlyRate:99}}});
  assert.equal(upgraded.portal.aiScan.hourlyRate,99);
  assert.equal(upgraded.portal.aiScan.tasks[0].task,'Facturen');
  assert.equal(upgraded.portal.dueDiligence.findings[0].finding,'Concentratierisico');
  assert.equal(upgraded.portal.strategy.dna.freeText,'Groei zonder kennisverlies');
  assert.equal(upgraded.portal.compliance.policies[0],'vastgesteld');
  assert.equal(upgraded.portal.migration.legacyV1Applied,true);
});

test('domain state automatically upgrades legacy state on load and keeps canonical state stable',async()=>{
  const legacyDomain=createDomainState({load:async()=>({mw:12,uur:80,cOmzet:1000}),save:async state=>state});
  await legacyDomain.init();
  assert.equal(legacyDomain.get('portal.profile.manualHoursPerWeek'),12);
  assert.equal(legacyDomain.get('portal.metrics.revenue'),1000);
  const canonical={portal:{profile:{manualHoursPerWeek:7}}};
  const canonicalDomain=createDomainState({load:async()=>canonical,save:async state=>state});
  await canonicalDomain.init();
  assert.deepEqual(canonicalDomain.get(),canonical);
});

test('financial and AI golden fixtures remain deterministic',()=>{
  const state={portal:{profile:{manualHoursPerWeek:18,hourlyCost:75,dimensionScores:[2,3,4,3]},metrics:{revenue:2400,grossMargin:42,ebitda:360,wages:800,marketing:120,it:96,dso:41,largestCustomer:24,customers:160},valueFinance:{debt:500,cash:120,equity:900,balance:1800,fixed:650,interest:45,multiple:6,wacc:9},businessCase:{target:4,delay:3,investment:120000},aiScan:{hourlyRate:85,tasks:[{hoursPerWeek:10,repetition:'Wekelijks',dataReadiness:4,errorRisk:3},{hoursPerWeek:6,repetition:'Dagelijks',dataReadiness:3,errorRisk:5}]}}};
  assert.equal(calculateLegacyEquivalent('gross-margin',state),42);
  assert.equal(calculateLegacyEquivalent('ebitda-margin',state),15);
  assert.equal(calculateLegacyEquivalent('enterprise-value',state),2160);
  assert.equal(calculateLegacyEquivalent('equity-value',state),1780);
  assert.equal(calculateLegacyEquivalent('interest-coverage',state),8);
  assert.equal(calculateLegacyEquivalent('annual-task-cost',state),62560);
  assert.ok(calculateLegacyEquivalent('opportunity-score',state)>0);
  assert.ok(calculateLegacyEquivalent('payback',state)>=0);
});

test('native V2 workspaces attach executable legacy algorithm evidence',async()=>{
  const shell=await readFile(new URL('../workspace-shell.js',import.meta.url),'utf8');
  const evidence=await readFile(new URL('../legacy-parity-evidence.js',import.meta.url),'utf8');
  assert.match(shell,/attachLegacyAlgorithmParity/);
  assert.match(shell,/legacy-parity-evidence\.js/);
  assert.match(evidence,/calculateCapability/);
  assert.match(evidence,/data-legacy-algorithm-parity|legacyAlgorithmParity/);
});
