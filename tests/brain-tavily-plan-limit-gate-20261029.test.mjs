import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTavilyQuotaGate} from '../supabase/functions/bg-externe-signalen/provider-retry.mjs';

test('Tavily HTTP 432 singleflight prevents three duplicate requests',async()=>{
 let calls=0;
 const gate=createTavilyQuotaGate();
 const f=async()=>{calls++;await Promise.resolve();throw new Error('HTTP_432:limit');};
 const values=await Promise.allSettled([gate.run(f),gate.run(f),gate.run(f)]);
 assert.equal(calls,1);
 assert.ok(values.every(x=>x.status==='rejected'));
 assert.equal(gate.snapshot().reason,'UPSTREAM_PLAN_LIMIT');
});
test('Tavily rate limit cooldown is bounded; 503 failures are not cached',async()=>{
 let now=0,calls=0;
 const gate=createTavilyQuotaGate({now:()=>now,rateCooldownMs:60000});
 await assert.rejects(gate.run(async()=>{calls++;throw Error('HTTP_429')}),/429/);
 await assert.rejects(gate.run(async()=>{calls++;return true}),/TAVILY_RATE_LIMIT_COOLDOWN/);
 assert.equal(calls,1);now=60001;
 await assert.rejects(gate.run(async()=>{calls++;throw Error('HTTP_503')}),/503/);
 assert.equal(await gate.run(async()=>{calls++;return true}),true);
});
test('existing authorized DataForSEO fallback and source receipts remain the only execution route',()=>{
 const s=fs.readFileSync('supabase/functions/bg-externe-signalen/index.ts','utf8');
 assert.match(s,/tavilyQuotaGate.run\(async\(\)=>/);
 assert.match(s,/fallbackReason=safeFailure\(error\)/);
 assert.match(s,/res=await dataforseoSerp\(o.zoekvraag,dataforseoLogin,dataforseoPassword\)/);
 assert.match(s,/const BATCH=3/);
 assert.match(s,/sourceBatchEvidenceVerdict\(results\)/);
 assert.match(s,/p_source_key:'external-intelligence'/);
 assert.match(s,/x-powerhouse-token/);
 assert.doesNotMatch(s,/setInterval\(|cron\.schedule\(/);
});
test('agents skill incident marker is indexed, not masked as baseline debt',()=>{
 const s=fs.readFileSync('.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md','utf8');
 const p=JSON.parse(fs.readFileSync('brain/policies/powerhouse-incident-register-and-self-fix-v1.json','utf8'));
 assert.match(s,/INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1/);
 assert.ok(!p.loop_debt_baseline.includes('powerhouse-source-universe-impact-engine'));
});
