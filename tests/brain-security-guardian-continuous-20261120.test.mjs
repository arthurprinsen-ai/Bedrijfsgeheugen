import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateInventory,classifyResponse,runSecurityGuardian,sha} from '../tools/security/site-guardian.mjs';
import {assertGitHubClaims,verifyGitHubActionsOidc,OIDC_AUDIENCE} from '../netlify/functions/_security-guardian-oidc.mjs';
import {validateSecurityGuardianReport} from '../netlify/functions/security-guardian-ingest.mjs';
import {classifyGuardianHeartbeat} from '../portal-v2/modules/security-trust-workspace.js';
import {publicIncidentSummary,syncIncidents} from '../tools/security/security-guardian-incidents.mjs';
const cfg=JSON.parse(readFileSync('config/security-managed-sites.json','utf8'));
const now=Date.parse('2026-11-20T22:00:00Z');
const headers=new Headers({'x-content-type-options':'nosniff','strict-transport-security':'max-age=31536000','x-frame-options':'DENY','cache-control':'private, no-store',
 'content-security-policy':"default-src 'self'; script-src 'self' 'sha256-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN12345='; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});
const businessHeaders=new Headers({...Object.fromEntries(headers.entries()),'x-frame-options':'SAMEORIGIN',
 'content-security-policy':"object-src 'none'; base-uri 'self'; frame-ancestors 'self'"});
const fakeResponse=(status,url='https://pw-mo14-1.netlify.app/zaalplanner/',h=headers)=>({status,ok:status>=200&&status<300,url,headers:h,body:null});
test('all 16 owned Netlify sites and both PW routes have strict read-only inventory with no SSRF',()=>{
 assert.equal(validateInventory(cfg).sites.length,17);
 assert.equal(cfg.expected_projects,16);
 for(const s of cfg.sites)assert.match(s.url,/^https:\/\//);
 assert.throws(()=>validateInventory({...cfg,sites:[...cfg.sites,{id:'local',url:'http://localhost/',mode:'standard'}]}),/INVALID_SITE/);
 assert.throws(()=>validateInventory({...cfg,sites:cfg.sites.slice(1)}),/INCOMPLETE|REQUIRED/);
});
test('critical CSP regression fails and protected site may not return public 200',()=>{
 assert.equal(classifyResponse({mode:'coach',url:'https://pw-mo14-1.netlify.app/zaalplanner/'},fakeResponse(200)).status,'VERIFIED');
 assert.equal(classifyResponse({mode:'critical',url:'https://www.bedrijfsgeheugen.nl/'},fakeResponse(200,'https://www.bedrijfsgeheugen.nl/',businessHeaders)).status,'VERIFIED');
 assert.equal(classifyResponse({mode:'protected'},fakeResponse(200)).code,'UNEXPECTED_PUBLIC_ACCESS');
 assert.equal(classifyResponse({mode:'protected'},fakeResponse(401)).status,'VERIFIED');
 assert.equal(classifyResponse({mode:'archive'},fakeResponse(200)).status,'WARN');
 const weakened=new Headers(headers);weakened.delete('content-security-policy');
 assert.equal(classifyResponse({mode:'coach'},fakeResponse(200,'https://pw-mo14-1.netlify.app/zaalplanner/',weakened)).status,'FAIL');
});
test('all-site report only green with every exact response and all private source paths 404',async()=>{
 const fetcher=async url=>{
  const u=String(url);if(u.includes('/supabase/migrations/')||u.includes('/scripts/')||u.includes('/config/')||u.endsWith('/package.json'))return fakeResponse(404,u,businessHeaders);
  const mode=cfg.sites.find(s=>s.url===u)?.mode;
  if(mode==='protected')return fakeResponse(401,u,headers);
  if(mode==='archive')return fakeResponse(404,u,headers);
  return fakeResponse(200,u,mode==='coach'?headers:businessHeaders);
 };
 const report=await runSecurityGuardian({fetcher,config:cfg,now:new Date(now)});
 assert.equal(report.total,21);
 assert.equal(report.status,'VERIFIED');
 assert.equal(report.failed,0);assert.equal(report.warning,0);
 assert.equal(Date.parse(report.expiresAt)-Date.parse(report.checkedAt),45*60000);
 assert.doesNotThrow(()=>validateSecurityGuardianReport(report,now+1000));
 const leak=await runSecurityGuardian({fetcher:async(u,o)=>u.includes('/scripts/security-operations-proof.mjs')?fakeResponse(200,u,businessHeaders):fetcher(u,o),config:cfg,now:new Date(now)});
 assert.equal(leak.status,'FAIL');
 assert.ok(leak.issues.some(i=>i.code==='PRIVATE_SOURCE_NOT_404'));
 assert.ok(leak.issues.every(i=>/^[0-9a-f]{16}$/.test(i.fingerprint)));
});
test('OIDC pinned to official GitHub Actions main workflow, expiry, issuer, repo and signature',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const jwk=publicKey.export({format:'jwk'});jwk.kid='test-key';jwk.use='sig';
 const t=Math.floor(now/1000),payload={iss:'https://token.actions.githubusercontent.com',aud:OIDC_AUDIENCE,repository:'arthurprinsen-ai/Bedrijfsgeheugen',
  workflow_ref:'arthurprinsen-ai/Bedrijfsgeheugen/.github/workflows/security-operations-proof.yml@refs/heads/main',
  ref:'refs/heads/main',event_name:'schedule',run_id:'123456',sub:'repo:arthurprinsen-ai/Bedrijfsgeheugen:ref:refs/heads/main',iat:t-10,exp:t+120};
 assert.doesNotThrow(()=>assertGitHubClaims(payload,t));
 assert.throws(()=>assertGitHubClaims({...payload,ref:'refs/heads/attacker'},t),/UNAUTHORIZED/);
 assert.throws(()=>assertGitHubClaims({...payload,exp:t-1},t),/UNAUTHORIZED/);
 const base64=s=>Buffer.from(JSON.stringify(s)).toString('base64url');
 const tokenBody=base64({alg:'RS256',kid:'test-key',typ:'JWT'})+'.'+base64(payload);
 const signature=sign('RSA-SHA256',Buffer.from(tokenBody),privateKey).toString('base64url');
 const subject=await verifyGitHubActionsOidc('Bearer '+tokenBody+'.'+signature,{now:t,fetchFn:async()=>({ok:true,json:async()=>({keys:[jwk]})})});
 assert.equal(subject.runId,'123456');
 await assert.rejects(verifyGitHubActionsOidc('Bearer '+tokenBody+'.'+'A'.repeat(signature.length),{now:t,fetchFn:async()=>({ok:true,json:async()=>({keys:[jwk]})})}),/INVALID_OIDC_SIGNATURE/);
});
test('portal indicator blinks only with independently current evidence; stale, WARN and FAIL never green',()=>{
 const observation=(status,expiresAt,proof=true)=>({provider_key:'WEBSITE',control_key:'SECURITY_HEARTBEAT',status,
  evidence_available:proof,observed_at:new Date(now).toISOString(),expires_at:expiresAt});
 const fresh=new Date(now+44*60000).toISOString(),old=new Date(now+46*60000).toISOString();
 assert.equal(classifyGuardianHeartbeat([observation('VERIFIED',fresh)],now+60000).state,'verified');
 assert.equal(classifyGuardianHeartbeat([observation('VERIFIED',old)],now+47*60000).state,'stale');
 assert.equal(classifyGuardianHeartbeat([observation('VERIFIED',fresh,false)],now+60000).state,'stale');
 assert.equal(classifyGuardianHeartbeat([observation('WARN',fresh)],now+60000).state,'review');
 assert.equal(classifyGuardianHeartbeat([observation('FAIL',fresh)],now+60000).state,'incident');
 assert.equal(classifyGuardianHeartbeat([],now).state,'unknown');
});
test('ingest rejects forged green status and incomplete site sets',()=>{
 const good={schemaVersion:1,checkedAt:new Date(now).toISOString(),expiresAt:new Date(now+45*60000).toISOString(),
 status:'VERIFIED',total:21,verified:21,warning:0,failed:0,evidenceAvailable:true,
 sites:[...cfg.sites.map(s=>({id:s.id,status:'VERIFIED',code:'BOUNDED_HTTP_CHECK_PASSED'})),...Array.from({length:4},()=>({id:'bedrijfsgeheugen',status:'VERIFIED',code:'BOUNDED_HTTP_CHECK_PASSED'}))],issues:[]};
 assert.doesNotThrow(()=>validateSecurityGuardianReport(good,now+1000));
 assert.throws(()=>validateSecurityGuardianReport({...good,verified:20},now+1000));
 assert.throws(()=>validateSecurityGuardianReport({...good,expiresAt:new Date(now+86400000).toISOString()},now+1000));
});

test('incident handoffs are sanitized, bounded, fingerprint-deduplicated and never auto-close',async()=>{
 const issue={fingerprint:sha('example:unsafe'),severity:'HIGH',siteHash:sha('private-site-name'),code:'PRIVATE_SOURCE_NOT_404'};
 const publicText=publicIncidentSummary(issue,{repository:'arthurprinsen-ai/Bedrijfsgeheugen',runId:'1234'});
 assert.match(publicText.body,/Original|original|Engineering/);
 assert.ok(!publicText.body.includes('private-site-name'));
 assert.ok(!publicText.body.includes('PRIVATE_SOURCE_NOT_404'));
 const calls=[];
 const call=args=>{calls.push(args);if(args[0]==='issue'&&args[1]==='list')return JSON.stringify([]);return '';};
 const report={issues:[issue,issue]};
 const result=await syncIncidents(report,{runId:'1234',repo:'arthurprinsen-ai/Bedrijfsgeheugen',call});
 assert.equal(result.created,1);
 assert.ok(calls.some(a=>a[0]==='issue'&&a[1]==='create'));
 assert.ok(!calls.some(a=>a[0]==='issue'&&a[1]==='close'));
});
test('security agent remains one of 14 originals and only existing workflow owns monitoring cadence',()=>{
 const team=readFileSync('platform/agents/agent-team.mjs','utf8');
 const workflow=readFileSync('.github/workflows/security-operations-proof.yml','utf8');
 assert.equal((team.match(/id:'agent-security'/g)||[]).length,1);
 assert.match(team,/monitor-all-authorized-managed-sites-every-15-minutes-in-original-security-operations-workflow/);
 assert.match(workflow,/7,22,37,52 \* \* \* \*/);
 assert.match(workflow,/id-token: write/);
 assert.match(workflow,/refs\/heads\/main/);
 assert.match(workflow,/agent/);
 const client=readFileSync('netlify/functions/security-trust.mjs','utf8');
 assert.match(client,/projectCustomerSecurityTrustResponse/);
 assert.match(client,/resolveIdentityTenant/);
 assert.match(client,/return json\(admin\?response:projectCustomerSecurityTrustResponse\(response\)\)/);
 const sql=readFileSync('supabase/migrations/20261007155500_data_ai_security_trust_center_v1.sql','utf8');
 assert.match(sql,/tenant_id in\s*\(v_tenant\s*,\s*'canonical'\s*\)/i);
});
