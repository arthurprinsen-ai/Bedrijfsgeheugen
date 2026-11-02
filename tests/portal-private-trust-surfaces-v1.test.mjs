import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {securityTone,safeSecurityEvidenceUrl,summarizeSecurityPlatforms,securityOverallPosture} from '../portal-v2/modules/security-trust-workspace.js';

const read=p=>readFile(p,'utf8');

test('trust and sovereignty pages are private authenticated portal surfaces',async()=>{
  const [app,shell]=await Promise.all([read('portal-v2/app.js'),read('portal-v2/page-shell.js')]);
  for(const id of ['data-ai-passport','trust-center','compliance-governance','compliance-command-center','eu-ai-act-audit']){
    assert.ok(shell.includes(id),id);
  }
  assert.match(shell,/PROTECTED_TRUST_PAGES/);
  assert.match(shell,/snap\?\.mode==='authenticated'/);
  assert.match(shell,/!portalContext\.stateClient\?\.isDemo\?\.\(\)/);
  assert.match(shell,/if\(isProtectedTrustPage\(pageId\)&&!hasProtectedTrustAccess\(\)\)return false/);
  assert.match(app,/promptProtectedTrustLogin/);
  assert.match(app,/isProtectedTrustPage\(page\.target\)&&!hasProtectedTrustAccess\(\)/);
});

test('native trust workspace reads only authenticated tenant APIs',async()=>{
  const source=await read('portal-v2/modules/security-trust-workspace.js');
  assert.match(source,/stateClient\.authHeaders/);
  assert.match(source,/stateClient\.currentUser/);
  assert.match(source,/stateClient\.isDemo/);
  assert.match(source,/\/api\/data-sovereignty/);
  assert.match(source,/\/api\/security-trust/);
  assert.match(source,/scope=bedrijfsgeheugen/);
  assert.match(source,/Ruwe security-evidence blijft server-only/);
});

test('legacy standalone trust URLs only deep-link to private Portal V2 pages',async()=>{
  const redirects=await read('_redirects');
  assert.match(redirects,/\/portal\/data-ai-passport\.html\s+\/portal-v2\/\?page=data-ai-passport\s+301!/);
  assert.match(redirects,/\/portal-next\/security\.html\s+\/portal-v2\/\?page=trust-center\s+301!/);
  assert.match(redirects,/\/portal-next\/compliance\.html\s+\/portal-v2\/\?page=compliance-command-center\s+301!/);
  assert.match(redirects,/\/portal-next\/\*\s+\/portal-v2\/\s+301!/);
});

test('customer labels and system map express private sovereignty and security surfaces',async()=>{
  const [registry,map,skill]=await Promise.all([
    read('portal-v2/page-registry.js'),
    read('platform/system-map/canonical-system-map.mjs'),
    read('.agents/skills/powerhouse-security-trust-center/SKILL.md')
  ]);
  assert.match(registry,/Data & AI Sovereignty/);
  assert.match(registry,/Security Trust Center/);
  assert.match(map,/protectedPagesHiddenBeforeLogin:true/);
  assert.match(map,/publicStandaloneSurfaces:false/);
  assert.match(map,/demoTrustAccess:false/);
  assert.match(map,/customerOwnTenantOnly:true/);
  assert.match(map,/canonicalScopeAdminOnly:true/);
  assert.match(skill,/Trust surfaces are private portal capabilities/);
});

// Security platform fail-closed regression: co-located with canonical Portal trust delivery owner.
import {securityTone,safeSecurityEvidenceUrl,summarizeSecurityPlatforms,securityOverallPosture} from '../portal-v2/modules/security-trust-workspace.js';

test('security statuses never produce false-green from negated or ambiguous evidence',()=>{
 for(const state of ['NOT_VERIFIED','UNVERIFIED','EVIDENCE_PARTIAL','UNKNOWN','STALE','EXPIRED','PENDING','NOT_VERIFIED_PASS',''])assert.notEqual(securityTone(state),'ok',state);
 for(const state of ['FAIL','CRITICAL','HIGH','ACTION_REQUIRED','BLOCKED','COMPROMISED'])assert.equal(securityTone(state),'bad',state);
 for(const state of ['VERIFIED','VERIFIED_NO_OPEN_FINDINGS','PASS','CURRENT'])assert.equal(securityTone(state),'ok',state);
});

test('trust evidence href rejects executable, relative, cleartext and credentialed URLs',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,alert(1)','http://example.com','/relative','//example.com','https://user:pass@example.com','mailto:test@example.com','ftp://example.com'])assert.equal(safeSecurityEvidenceUrl(url),null,url);
 assert.equal(safeSecurityEvidenceUrl('https://supabase.com/docs/guides/security/product-security'), 'https://supabase.com/docs/guides/security/product-security');
});

test('platform posture requires every independently observed control with actual evidence',()=>{
 const blank=summarizeSecurityPlatforms();
 assert.equal(blank.length,4);
 for(const row of blank){assert.equal(row.status,'EVIDENCE_PARTIAL');assert.equal(row.observed,0);}
 const github=[{provider_key:'GITHUB',control_key:'CODEQL',status:'VERIFIED',evidence_available:true}];
 assert.equal(summarizeSecurityPlatforms(github)[0].status,'EVIDENCE_PARTIAL');
 const githubFull=['CODEQL','BRANCH_PROTECTION','SECRET_SCANNING'].map(control_key=>({provider_key:'GITHUB',control_key,status:'VERIFIED',evidence_available:true}));
 assert.equal(summarizeSecurityPlatforms(githubFull)[0].status,'VERIFIED');
 assert.equal(summarizeSecurityPlatforms(githubFull.map(x=>x.control_key==='CODEQL'?{...x,status:'NOT_VERIFIED'}:x))[0].status,'EVIDENCE_PARTIAL');
 assert.equal(summarizeSecurityPlatforms(githubFull.map(x=>x.control_key==='SECRET_SCANNING'?{...x,evidence_available:false}:x))[0].status,'EVIDENCE_PARTIAL');
 assert.equal(summarizeSecurityPlatforms(githubFull.map(x=>x.control_key==='CODEQL'?{...x,status:'ACTION_REQUIRED'}:x))[0].status,'ACTION_REQUIRED');
});

test('portal only displays metadata and remains under authenticated trust shell',async()=>{
 const source=await readFile('portal-v2/modules/security-trust-workspace.js','utf8');
 assert.match(source,/data-security-platforms/);
 assert.match(source,/security_trust_get|\/api\/security-trust/);
 assert.match(source,/stateClient\.authHeaders/);
 assert.doesNotMatch(source,/JSON\.stringify\(o\.evidence\)/);
});

test('global security hero cannot be green when platform provider observation is missing',()=>{
 assert.equal(securityOverallPosture({postureStatus:'VERIFIED_NO_OPEN_FINDINGS'},[]),'EVIDENCE_PARTIAL');
 assert.equal(securityOverallPosture({postureStatus:'ACTION_REQUIRED'},[]),'ACTION_REQUIRED');
 const risk=[{provider_key:'SUPABASE',control_key:'DATABASE_ADVISOR',status:'FAIL',evidence_available:true}];
 assert.equal(securityOverallPosture({postureStatus:'VERIFIED_NO_OPEN_FINDINGS'},risk),'ACTION_REQUIRED');
});
