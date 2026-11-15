import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publishedBusinessMailto,firstPartySourceRetryDue} from '../supabase/functions/_shared/public-business-email-evidence.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const research=read('supabase/functions/powerhouse-relationship-public-research/index.ts');
const composer=read('supabase/functions/powerhouse-commercial-message-composer/index.ts');
const outreach=read('supabase/functions/powerhouse-autonomous-outreach/index.ts');

test('large public HTML is sampled with hard byte bound, not falsely marked fully read',()=>{
  assert.match(research,/const room=160000-size/);
  assert.match(research,/part\.value\.subarray\(0,room\)/);
  assert.match(research,/await reader\.cancel\(\)/);
  assert.match(research,/sourceDiagnostics\.push\('SOURCE_HTML_TRUNCATED'\)/);
  assert.match(research,/result\.sites>0&&!truncated/);
  assert.match(research,/SOURCE_HTML_TRUNCATED_UNVERIFIED/);
  assert.match(research,/public_email_source_checked:checked,public_email_source_status:sourceStatus/);
  assert.match(research,/firstPartySourceRetryHours\(attemptNumber\)/);
  assert.match(research,/\.eq\('action_id',selected\.action_id\)\.eq\('dedupe_key',key\)/);
});

test('original source retry keeps same action, due timestamp and privacy gates',()=>{
  const key='relationship-research:public-domain:2026-11-15:employee-1';
  const evidence={public_email_source_checked:false,public_email_next_attempt_at:'2026-11-15T12:00:00.000Z'};
  assert.equal(firstPartySourceRetryDue(key,evidence,'2026-11-15T13:00:00Z'),true);
  assert.equal(firstPartySourceRetryDue(key,evidence,'2026-11-15T11:59:59Z'),false);
  assert.equal(firstPartySourceRetryDue(key,{...evidence,public_email_source_checked:true},'2026-11-15T13:00:00Z'),false);
  const html='<h1>Acme Data BV</h1><p>Janneke van Dijk <a href="mailto:janneke@acmedata.nl">E-mail</a></p>';
  const candidate=publishedBusinessMailto({html,sourceUrl:'https://acmedata.nl/team',personName:'Janneke van Dijk',companyName:'Acme Data BV',observedAt:'2026-11-15T13:00:00Z'});
  assert.equal(candidate?.email,'janneke@acmedata.nl');
  assert.equal(candidate?.send_authority,'NOT_INFERRED');
  assert.equal(publishedBusinessMailto({html:html.replace('janneke@acmedata.nl','info@acmedata.nl'),sourceUrl:'https://acmedata.nl/team',personName:'Janneke van Dijk',companyName:'Acme Data BV',observedAt:'2026-11-15T13:00:00Z'}),null);
});

test('held original composer considers beyond first 50 but requires independent source proof',()=>{
  assert.match(composer,/const pageSize=50,maxPages=4/);
  assert.match(composer,/\.range\(page\*pageSize,\(page\+1\)\*pageSize-1\)/);
  assert.match(composer,/\.order\('priority',\{ascending:false\}\)\.order\('action_id',\{ascending:true\}\)/);
  assert.match(composer,/if\(\(waiting\|\|\[\]\)\.length<pageSize\)break/);
  assert.match(composer,/sourceVerifiedComposerHandoff\(action,research,news,now\)/);
  assert.match(composer,/if\(verified\)resumed\.push\(verified\)/);
  assert.match(composer,/qv\.checks\.source_specific_evidence_ok===true/);
});

test('email dispatch and result learning remain original provider-only and no resend',()=>{
  assert.match(outreach,/providerUncertaintyNoResend/);
  assert.match(outreach,/verifyRecipientAuthority/);
  assert.match(outreach,/provider_readback_verified:true/);
  assert.match(outreach,/\.from\('powerhouse_sales_outcomes'\)/);
  assert.match(research,/external_send_executed:false/);
  assert.match(research,/public_email_consumer_processed:'NOT_PROVEN'/);
});
