import test from 'node:test';
import assert from 'node:assert/strict';
import {REGELGEVING,STATUS,verlopenHerzieningen,achterhaaldeStatus} from '../portal-v2/regelgeving.js';

const ids=['rechtsvermoeden-uurtarief','zelfstandigenwet','loontransparantie'];
const byId=id=>REGELGEVING.find(x=>x.id===id);

test('all three dated 15-Nov legal alerts have genuinely renewed official source and bounded next review',()=>{
 for(const id of ids){
  const x=byId(id);
  assert.ok(x,id);
  assert.equal(x.peildatum,'2026-11-16',id);
  assert.equal(x.herzienUiterlijk,'2026-12-15',id);
  assert.match(x.url,/^https:\/\/(?:zoek\.officielebekendmakingen\.nl|wetgevingskalender\.overheid\.nl|www\.rijksoverheid\.nl)\//,id);
  assert.ok(x.letop.length>120, 'must contain real reviewed legal context '+id);
 }
 assert.equal(verlopenHerzieningen('2026-11-16').length,0);
 assert.equal(achterhaaldeStatus('2026-11-16').length,0);
});

test('enacted hourly-rate presumption has exact 31-Dec-2026 effective date, not old guess',()=>{
 const x=byId('rechtsvermoeden-uurtarief');
 assert.equal(x.status,STATUS.VERWACHT);
 assert.deepEqual(x.mijlpalen.map(m=>m.datum),['2026-12-31']);
 assert.match(x.letop,/31 december 2026/);
 assert.match(x.letop,/Staatsblad 2026, 207/);
 assert.match(x.url,/stb-2026-207/);
 assert.doesNotMatch(x.mijlpalen[0].wat,/1 januari 2027/);
});

test('Zelfstandigenwet must remain proposal distinct from enacted rechtsvermoeden',()=>{
 const x=byId('zelfstandigenwet');
 assert.equal(x.status,STATUS.VOORSTEL);
 assert.equal(x.mijlpalen[0].datum,'2028-01-01');
 assert.match(x.mijlpalen[0].wat,/niet vastgestelde/);
 assert.match(x.letop,/29 oktober 2026/);
 assert.match(x.letop,/9 november 2026/);
 assert.match(x.url,/WGK029502/);
});

test('pay transparency national implementation is not marked legally in force',()=>{
 const x=byId('loontransparantie');
 assert.equal(x.status,STATUS.VOORSTEL);
 assert.equal(x.mijlpalen[0].datum,'2027-01-01');
 assert.match(x.mijlpalen[0].wat,/alleen indien/);
 assert.match(x.letop,/7 juni 2026/);
 assert.match(x.letop,/nog niet definitief aangenomen/);
 assert.match(x.url,/rijksoverheid\.nl/);
 assert.ok(x.mijlpalen.some(m=>m.datum==='2028-06-07'));
});

test('a missed future review remains visible; this patch does not disable fail-closed recency',()=>{
 for(const id of ids) assert.ok(verlopenHerzieningen('2026-12-16').some(x=>x.id===id));
});
