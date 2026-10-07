import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

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
