import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=x=>readFileSync(x,'utf8');
const patch=JSON.parse(read('config/bg-static-i18n-en.d/2026-11-17-terminal-source-text-split.json'));
const htmlAfas=read('afas-koppeling.html');
const htmlSystems=read('systemen-koppelen.html');
const workflow=read('.github/workflows/powerhouse-daily-self-evolution.yml');

test('link-split AFAS source segment and independent system fragment have exact English cache entries',()=>{
  const start=htmlAfas.indexOf('<p>Wil je Shopify, WooCommerce of Lightspeed');
  const stop=htmlAfas.indexOf('<a href="/webshop-koppeling">',start);
  assert.ok(start>=0&&stop>start,'exact AFAS public source and link must exist');
  const first=htmlAfas.slice(start+3,stop).trim();
  const partial=htmlSystems.indexOf('· formulier naar CRM');
  const end=htmlSystems.indexOf('</p>',partial);
  assert.ok(partial>=0&&end>partial,'exact systems public source must exist');
  const second=htmlSystems.slice(partial,end).trim();
  assert.deepEqual(Object.keys(patch).sort(),[first,second].sort(),'do not hide unmatched translations or source drift');
  for(const key of [first,second]){
    assert.ok(patch[key].length>20&&/[a-z]/i.test(patch[key]),'nonempty human-reviewed English text');
    assert.ok(!/\b(?:Wil je|koppelen|uren naar|voorraad naar|factuurgegevens)\b/i.test(patch[key]),'no untranslated Dutch fallback');
    assert.ok(!patch[key].includes('<a '),'cache is plain text, never raw HTML');
  }
  assert.equal(patch[second],'· forms to CRM · time entries to invoicing · inventory to the webshop.');
});

test('original recovery selector verifies ONE YAML job not arbitrary following jobs',()=>{
  const job=workflow.split(/^  original-intake-recovery:\n/m)[1]?.split(/^  [a-z][a-z0-9-]*:\n/m)[0];
  assert.ok(job,'original controlled scope exists');
  assert.match(job,/node scripts\/brain\/innovation-original-agent-pre-review\.mjs --writeback/);
  assert.match(job,/secrets\.BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(job,/GITHUB_TOKEN|ai-model-intelligence-audit\.mjs|new Queue|new Publisher/);
  const synthetic='on:\n  schedule:\n    - cron: "47 4 * * *"\njobs:\n  original-intake-recovery:\n    steps:\n      - run: source-verified-only\n  original-delivery-recovery:\n    steps:\n      - env: GITHUB_TOKEN\n';
  const bounded=synthetic.split(/^  original-intake-recovery:\n/m)[1]?.split(/^  [a-z][a-z0-9-]*:\n/m)[0];
  assert.match(bounded,/source-verified-only/);
  assert.doesNotMatch(bounded,/GITHUB_TOKEN/);
  assert.equal((workflow.match(/^\s+- cron:/gm)||[]).length,1,'never add a second schedule');
});
