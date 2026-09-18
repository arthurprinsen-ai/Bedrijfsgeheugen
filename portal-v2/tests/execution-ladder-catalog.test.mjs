import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DIMENSIONS } from '../modules/company-input.js';
import { EXECUTION_LADDER_CATALOG, EXECUTION_LADDER_STEPS, EXECUTION_LADDER_REALIZABILITY } from '../execution-ladder-catalog.js';
import { executionLadderModel, selectExecutionThemes, toggleExecutionStep } from '../execution-ladder.js';
import { upgradeLegacyPortalState } from '../legacy-state-migration.js';

const maturity=Object.fromEntries(PROFILE_DIMENSIONS.map((x,i)=>[x.id,(i%4)+1]));
const base={portal:{profile:{employees:24,hourlyCost:52,maturity},advice:{items:[{dimension:'finance'},{dimension:'finance'},{dimension:'tech'}]}}};

test('exact legacy execution catalog preserves eight specialist ladders with five fixed steps each',()=>{
  assert.deepEqual(EXECUTION_LADDER_STEPS,['Tellen','Vastleggen','Koppelen','Meten','Borgen']);
  assert.equal(EXECUTION_LADDER_REALIZABILITY,.70);
  assert.equal(Object.keys(EXECUTION_LADDER_CATALOG).length,8);
  for(const [id,ladder] of Object.entries(EXECUTION_LADDER_CATALOG)){
    assert.equal(ladder.s.length,5,id);
    const sum=ladder.s.reduce((s,x)=>s+x.deel,0);
    assert.ok(Math.abs(sum-1)<1e-9,id+' shares sum to '+sum);
    for(const step of ladder.s){
      assert.ok(['afdeling','directie','project'].includes(step.rol));
      assert.ok(step.w&&step.wie&&step.klaar);
      assert.ok(step.mnd>=1&&step.mnd<=12);
      assert.ok(step.d>=1);
    }
  }
});

test('execution model chooses exactly three legacy-priority themes and exposes fifteen steps',()=>{
  const themes=selectExecutionThemes(base);
  assert.equal(themes.length,3);
  assert.equal(themes.reduce((s,x)=>s+x.steps.length,0),15);
  const model=executionLadderModel(base);
  assert.equal(model.totalSteps,15);
  assert.equal(model.completed,0);
  assert.ok(model.potential>0);
  assert.equal(model.realized,0);
});

test('step completion persists in canonical Portal state and realizes only that legacy share',()=>{
  const state=structuredClone(base);
  const holder={state,get(){return this.state},set(path,value){const keys=path.split('.');let x=this.state;for(let i=0;i<keys.length-1;i++)x=x[keys[i]]??={};x[keys.at(-1)]=value}};
  const before=executionLadderModel(holder.get());
  const theme=before.themes[0],step=theme.steps[0];
  toggleExecutionStep(holder,theme.id,0);
  const after=executionLadderModel(holder.get());
  assert.equal(after.completed,1);
  assert.ok(Math.abs(after.realized-theme.cost*.70*step.deel)<1e-9);
});

test('legacy S.uitvoering completion map migrates without losing checked steps',()=>{
  const migrated=upgradeLegacyPortalState({legacy:{mw:24,uur:52,uitvoering:{finance:{0:true,1:false},tech:{2:true}}}});
  assert.equal(migrated.portal.execution.completed.finance[0],true);
  assert.equal(migrated.portal.execution.completed.finance[1],false);
  assert.equal(migrated.portal.execution.completed.tech[2],true);
});
