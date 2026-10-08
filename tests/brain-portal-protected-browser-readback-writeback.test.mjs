import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('protected browser UI proof must first enforce anonymous denial and cannot be mistaken for tenant auth',async()=>{
  const fixture=await readFile(new URL('./integration/portal-v2-protected-render-fixture.mjs',import.meta.url),'utf8');
  assert.match(fixture,/hasProtectedTrustAccess\(\)/);
  assert.match(fixture,/openPortalPage\(id\)!==false/);
  assert.match(fixture,/SECURITY_REGRESSION_PROTECTED_PORTAL_OPENED_ANONYMOUSLY/);
  assert.match(fixture,/SYNTHETIC_RENDER_ONLY_NOT_AUTHENTICATED_TENANT_PROOF/);
  assert.match(fixture,/authHeaders:async\(\)=>\(\{\}\)/);
});

test('production browser parity uses the strict protected route fixture on both navigation modes',async()=>{
  const paths=['./integration/portal-v2-production-full-parity.spec.js','./integration/portal-v2-production-legacy-algorithm-parity.spec.js'];
  for(const path of paths){
    const file=await readFile(new URL(path,import.meta.url),'utf8');
    assert.match(file,/renderProtectedWorkspaceFixture/);
    assert.match(file,/compliance-governance/);
  }
  const full=await readFile(new URL(paths[0],import.meta.url),'utf8');
  assert.match(full,/assertProtectedRouteDeniedAnonymously/);
});

test('CSRD production check opens exact native route rather than ambiguous text search',async()=>{
  const file=await readFile(new URL('./integration/portal-v2-production-csrd.spec.js',import.meta.url),'utf8');
  assert.match(file,/openPortalPage\('csrd-impact'\)/);
  assert.match(file,/data-page-id','csrd-impact'/);
  assert.match(file,/\.csrd-cockpit/);
  assert.doesNotMatch(file,/getByRole\('button', \{ name: \/CSRD & Impact\//);
});
