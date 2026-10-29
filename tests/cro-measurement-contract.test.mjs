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
// De bestaande native Andere data pagina is eigenaar van PR #5140; deze tests bewaken de rauwe event-ingress van issue #5141.\n