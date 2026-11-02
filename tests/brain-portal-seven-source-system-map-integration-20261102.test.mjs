import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');

test('exact original canonical System Map digest must version the sole Portal entrypoint',()=>{
 const map=read('platform/system-map/canonical-system-map.mjs');
 const html=read('portal-v2/index.html');
 const digest=map.match(/explanationInventory:Object\.freeze\(\{contract:'portal-explanation-autosync-v1',contentHash:'([a-f0-9]{64})'/)?.[1];
 assert.ok(digest,'canonical explanation hash is required');
 assert.ok(html.includes('./app.js?bg_explain='+digest),'no stale browser app.js despite System Map regeneration');
 assert.equal((html.match(/\.\/app\.js\?bg_explain=/g)||[]).length,1);
});

test('seven-source original owner-only Portal panel is evidence-limited, never full-loop or sales success',()=>{
 const source=read('portal-v2/control-plane-cockpit.js');
 assert.match(source,/const sourceNames=Object\.keys\(source\)/);
 assert.match(source,/source\[name\]==='LIVE'/);
 assert.match(source,/Bronnen LIVE:/);
 assert.match(source,/Volledige uitvoeringsketen: <strong>NIET BEWEZEN<\/strong>/);
 assert.match(source,/data-proof=\\"END_TO_END_UNPROVEN\\"/);
 assert.doesNotMatch(source,/Volledige uitvoeringsketen: <strong>BEWEZEN<\/strong>/);
});

test('integration does not install a second source executor or bypass the seven-read authority',()=>{
 const source=read('portal-v2/control-plane-cockpit.js');
 const map=read('platform/system-map/canonical-system-map.mjs');
 assert.doesNotMatch(source,/cron\.schedule|supabase\.from\(|createClient\(|service_role|serviceRoleKey/i);
 assert.match(map,/explanationInventory:Object\.freeze/);
});
