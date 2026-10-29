import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('CRO browser retains pending observations until database ACK',()=>{
 const src=read('assets/meting.js');
 assert.match(src,/NO_DATABASE_ACK/);
 assert.match(src,/ack\.bevestigd!==batch\.length/);
 assert.match(src,/sessionStorage\.setItem\(WACHT_SLEUTEL/);
 assert.doesNotMatch(src,/wacht\.splice\(0,50\)/);
 assert.doesNotMatch(src,/navigator\.sendBeacon/);
 assert.match(src,/keepalive:true/);
 assert.match(src,/wacht\.length>=MAX/);
 assert.match(src,/bg_meting_queue_overflow_v1/);
 assert.match(src,/Never evict an unacknowledged event/);
});

test('CRO server is idempotent and does not claim success on DB failure',()=>{
 const src=read('supabase/functions/bg-interactie/index.ts');
 assert.match(src,/onConflict: 'event_uid'/);
 assert.match(src,/ignoreDuplicates: true/);
 assert.match(src,/bevestigd: rijen\.length/);
 assert.match(src,/status: 503/);
 assert.match(src,/ok: false, opgeslagen: 0, bevestigd: 0/);
});
test('new CRO signals are consent-gated and no form values collected',()=>{
 const client=read('assets/meting.js'),server=read('supabase/functions/bg-interactie/index.ts');
 for(const event of ['pagina_verlaten','sectie_zichtbaar','formulier_fout','formulier_verlaten','whatsapp_klik','popup_getoond','experiment_blootstelling']){
  assert.ok(client.includes(event)||event==='popup_getoond',event+' producer');
  assert.ok(server.includes(event),event+' accepted');
 }
 assert.match(server,/DETAIL_GEBEURTENISSEN\.has\(g\) && toestemming !== true/);
 assert.doesNotMatch(client,/el\.innerText/);
 assert.doesNotMatch(client,/el\.value/);
});
test('unique event UUID migration is additive',()=>{
 const sql=read('supabase/migrations/20261029180000_bg_cro_event_uid_v1.sql');
 assert.match(sql,/ADD COLUMN IF NOT EXISTS event_uid text/);
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS/);
 assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('canonical growth writer never emits a second CTA event for generated money pages',()=>{
 const src=read('assets/meting.js');
 assert.match(src,/getElementById\('bg-growth-measurement'\)/);
 assert.match(src,/el\.closest\('main'\)/);
 assert.match(src,/\[data-bg-conversion\]/);
});

// De bestaande native Andere data pagina is eigenaar van PR #5140; deze tests bewaken de rauwe event-ingress van issue #5141.\n
test('cryptographically secure event UID fallback never uses Math.random or silently persists without crypto',async()=>{
  const src=read('assets/meting.js');
  const start=src.indexOf('function eventId()'),end=src.indexOf('function toestemming()',start);
  assert.ok(start>0&&end>start);
  const fn=src.slice(start,end);
  assert.match(fn,/crypto\.getRandomValues\(bytes\)/);
  assert.doesNotMatch(fn,/Math\.random\(\)/);
  assert.match(src,/if\(!uid\)\{/);
  assert.match(src,/bg_meting_uid_unavailable_v1/);
  const {runInNewContext}=await import('node:vm');
  const ctx={window:{crypto:true},crypto:{getRandomValues(bytes){for(let i=0;i<bytes.length;i++)bytes[i]=(i*13+17)&255;return bytes;}},Uint8Array,Array};
  const uuid=runInNewContext(fn+';eventId()',ctx);
  assert.match(uuid,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(runInNewContext(fn+';eventId()',{window:{crypto:null},crypto:null,Uint8Array,Array}),null);
});
