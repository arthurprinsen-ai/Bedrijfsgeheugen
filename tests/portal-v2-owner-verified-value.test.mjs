import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOwnerVerifiedValueReport,renderOwnerValueReport} from '../portal-v2/owner-verified-value.js';

const tenant='customer-one';
const item=(id,amount,unit,evidenceIds,extra={})=>({id,subjectId:'action:'+id,problemId:'PH-P002',realisedValue:amount,valueUnit:unit,evidenceIds,...extra});
const source=values=>({tenantId:tenant,verifiedValue:{verifiedValues:values}});

test('no tenant, mismatched tenant or absent canonical value are unknown',()=>{
 for(const input of [null,{},source([]),{...source([]),tenantId:'other'}]){
  const m=buildOwnerVerifiedValueReport(input,{expectedTenant:'other-tenant'});
  assert.equal(m.status,'NOT_PROVEN');assert.equal(m.records,0);
  assert.equal(m.totals.eur,null);assert.equal(m.totals.hours,null);
 }
 assert.equal(buildOwnerVerifiedValueReport({tenantId:tenant},{expectedTenant:tenant}).status,'NOT_PROVEN');
});
test('server-verified EUR and time outcomes remain separated and traceable',()=>{
 const m=buildOwnerVerifiedValueReport(source([
  item('a',2850,'EUR',['invoice:001','delivery:11']),
  item('b',12.5,'uren',['timesheet:004']),
  item('c',-50,'€',['adjustment:003'])
 ]),{expectedTenant:tenant});
 assert.equal(m.status,'PROVEN');assert.equal(m.records,3);
 assert.equal(m.totals.eur,2800);assert.equal(m.totals.hours,12.5);
 assert.equal(m.items[0].problemId,'PH-P002');assert.equal(m.items[0].evidenceIds.length,2);
 assert.match(renderOwnerValueReport(m),/2\.800/);
 assert.match(renderOwnerValueReport(m),/12,5 uur/);
});
test('duplicate IDs and proof references cannot inflate verified totals',()=>{
 const m=buildOwnerVerifiedValueReport(source([
  item('a',300,'eur',['bill:1']),
  item('a',900,'eur',['bill:2']),
  item('b',700,'eur',['bill:1']),
  item('c',3,'hours',['bill:1']), // different unit: not the same value assertion
  item('d',800,'usd',['bill:4']),
  item('e',20,'eur',[]),
  item('f',Number.POSITIVE_INFINITY,'eur',['bill:6']),
  item('g',2e12,'eur',['bill:7']),
  item('h',10,'eur',['bill:8'],{problemId:'invalid'})
 ]),{expectedTenant:tenant});
 assert.equal(m.totals.eur,310);assert.equal(m.totals.hours,3);
 assert.equal(m.records,3);assert.equal(m.excluded,6);assert.equal(m.unattributed,1);
});
test('legacy-only verified outcomes or aggregate forecasts never count as realized value',()=>{
 const m=buildOwnerVerifiedValueReport({tenantId:tenant,verifiedValue:{
  totals:{EUR:999999},verifiedOutcomes:[item('legacy',1000,'EUR',['e:1'])],verifiedValues:[]
 }},{expectedTenant:tenant});
 assert.equal(m.status,'NO_SUPPORTED_VERIFIED_VALUE');
 assert.equal(m.totals.eur,null);
 assert.match(renderOwnerValueReport(m),/Nog geen meetbaar resultaat/);
 assert.doesNotMatch(renderOwnerValueReport(m),/999\.999/);
});
test('user sourced outcome labels and evidence ids are escaped',()=>{
 const m=buildOwnerVerifiedValueReport(source([item('id',10,'eur',['<img onerror=alert(1)>'],{subjectId:'<svg/onload=alert(2)>'})]),{expectedTenant:tenant});
 const html=renderOwnerValueReport(m);
 assert.doesNotMatch(html,/<svg|<img/i);
 assert.match(html,/&lt;svg/);assert.match(html,/&lt;img/);
 assert.match(html,/Geen bewezen probleemkoppeling|PH-P002/);
});
