import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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
