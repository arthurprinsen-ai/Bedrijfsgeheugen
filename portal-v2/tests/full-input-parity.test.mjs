import test from 'node:test';
import assert from 'node:assert/strict';
import { fullCompanyInputGroups, fullCompanyInputSchema } from '../modules/full-company-input.js';

const REQUIRED_IDS=[
  'mw','uur',
  'cOmzet','cBrutomarge','cEbitda','cLoon','cKlanten','cGrootste','cMarketing','cNieuw','cDso','cIt',
  'wSchuld','wCash','wEV','wBalans','wVast','wRente','wMultiple','wWacc',
  'mVerzuim','mVerloop','mEnps','mMto','mVac',
  'kNps','kTevreden','kHerhaal','kKlacht',
  'pDeclarabel','pOtif','pDoorloop','pFout','pOfferte','pOrders','pOpleiding','pVerloopKlant',
  'mtDatum','mtSoort','mtWaarde','mtNotitie'
];

test('full input aggregation exposes every legacy scalar company input',()=>{
  const ids=new Set(fullCompanyInputSchema().map(field=>field.legacyFieldId));
  for(const id of REQUIRED_IDS)assert.ok(ids.has(id),`missing legacy input ${id}`);
});

test('full input aggregation includes policies and all eleven ESG topics',()=>{
  const fields=fullCompanyInputSchema();
  assert.equal(fields.filter(field=>String(field.legacyFieldId).startsWith('beleidLijst:')).length,12);
  assert.equal(fields.filter(field=>String(field.legacyFieldId).startsWith('esgVelden:')).length,11);
});

test('input groups preserve legacy semantic sections',()=>{
  const labels=fullCompanyInputGroups().map(group=>group.label);
  for(const label of ['Profiel','Bedrijfscijfers','Balans en financiering','Mensen','Klanten','Productiviteit','Metingen','Duurzaamheid','Beleid']){
    assert.ok(labels.includes(label),`missing group ${label}`);
  }
});

test('every aggregated input writes to canonical portal state',()=>{
  for(const field of fullCompanyInputSchema()){
    assert.match(field.path,/^portal\./,`${field.legacyFieldId} does not use canonical portal state`);
  }
});
