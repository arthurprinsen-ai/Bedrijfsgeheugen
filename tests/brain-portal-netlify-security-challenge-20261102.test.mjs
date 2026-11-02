import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {classifyPortalBrowserReadback,PORTAL_BROWSER_SECURITY_CHALLENGE_VERSION} from './integration/portal-readback-security-challenge.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const netlifyHtml='<h1>www.bedrijfsgeheugen.nl</h1><p>We are verifying your connection. This will only take a few seconds...</p><p>Security by <a href="https://www.netlify.com/security/">Netlify</a></p>';

test('real Netlify challenge is a failed provider proof, never an OK page',()=>{
 assert.equal(PORTAL_BROWSER_SECURITY_CHALLENGE_VERSION,'portal-browser-security-challenge-v1');
 assert.equal(classifyPortalBrowserReadback({status:403,html:netlifyHtml}),'NETLIFY_SECURITY_CHALLENGE');
 assert.notEqual(classifyPortalBrowserReadback({status:403,html:netlifyHtml}),'HTTP_OK');
});
test('classification cannot excuse a 403, 401, 404, 429 or 500 without both signatures',()=>{
 for(const status of [401,403,404,429,500]){
  const classification=classifyPortalBrowserReadback({status,html:'Application error'});
  assert.equal(classification,'HTTP_ERROR');
 }
 assert.equal(classifyPortalBrowserReadback({status:403,html:'We are verifying your connection only'}),'HTTP_ERROR');
 assert.equal(classifyPortalBrowserReadback({status:200,html:netlifyHtml}),'HTTP_OK');
 assert.equal(classifyPortalBrowserReadback({status:0,html:netlifyHtml}),'INVALID_HTTP_STATUS');
});
test('original production browser still fails closed on 403, preserves auth and exact source',()=>{
 const spec=read('tests/integration/portal-v2-production-legacy-algorithm-parity.spec.js');
 assert.match(spec,/response\.status\(\)===403/);
 assert.match(spec,/NETLIFY_SECURITY_CHALLENGE_READBACK_BLOCKED/);
 assert.match(spec,/response\.status\(\).*toBeLessThan\(400\)/);
 assert.match(spec,/compliance-governance/);
 assert.doesNotMatch(spec,/ignoreHTTPSErrors|route\.fulfill|skip\s*\(|force:\s*true/);
 const lesson=JSON.parse(read('brain/learning/2026-11-02-portal-netlify-security-challenge-readback-v1.json'));
 assert.equal(lesson.status,'CANDIDATE');
 assert.equal(lesson.parent_issue,4547);
 assert.equal(lesson.compiler.security_sensitive,true);
 for(const mode of ['historical_replay','shadow','canary'])
  assert.deepEqual(lesson.evaluation[mode],['tests/brain-portal-netlify-security-challenge-20261102.test.mjs']);
 assert.match(read('.agents/skills/powerhouse-browser-gate-boundedness/SKILL.md'),/NETLIFY_SECURITY_CHALLENGE_READBACK_BLOCKED/);
 assert.match(read('.agents/skills/portal-living-interface/SKILL.md'),/Netlify HTTP 403 challenge/);
});
