import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const load=(p)=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('real provider latency is accommodated by ORIGINAL setup audit budget, not unconditional success',async()=>{
 const code=await load('supabase/functions/powerhouse-content-loop/index.ts');
 const raw=code.match(/'powerhouse-composio-linkedin-setup':\s*([0-9_]+)\s*,/);
 assert.ok(raw,'Original LinkedIn connector preflight must retain its own bounded timeout');
 const timeoutMs=Number(raw[1].replaceAll('_',''));
 // 2026-10-31 production function_edge_logs: HTTP 200 / 21,182 ms.
 assert.ok(timeoutMs>21182,'8-second abort must not erase a real 21.2s HTTP200 response');
 assert.ok(timeoutMs>=25000&&timeoutMs<=30000,'Budget remains bounded and conservative');
 const lease=Number(code.match(/const LOOP_LEASE_MS\s*=\s*([0-9_]+)/)?.[1].replaceAll('_',''));
 assert.ok(Number.isFinite(lease)&&timeoutMs<lease/6,'One setup audit must not consume the original lease');
 assert.match(code,/signal:\s*AbortSignal\.timeout\(timeoutMs\)/);
 assert.match(code,/return\s*\{\s*name, http: 0, ok: false, timed_out:/);
 assert.match(code,/CONTENT_LOOP_AUTH_LOOKUP_FAILED/);
 assert.match(code,/authSecret\.data/);
 assert.match(code,/x-powerhouse-token/);
});
test('setup timeout fix never changes content generation or publisher quality/duplication gates',async()=>{
 const [code,skill]=await Promise.all([
  load('supabase/functions/powerhouse-content-loop/index.ts'),
  load('.agents/skills/powerhouse-self-improvement-layer/SKILL.md')
 ]);
 assert.match(code,/'powerhouse-content-orchestrator':\s*110_000/);
 assert.match(code,/'powerhouse-social-publisher':\s*25_000/);
 assert.match(code,/const TERMINAL_GREEN = new Set\(\['LIVE_PROVEN','MEASURED','LEARNED'\]\)/);
 assert.match(code,/const LOOP_LEASE_MS = 240_000/);
 assert.match(skill,/LINKEDIN_ORIGINAL_SETUP_TIMEOUT_V1/);
 assert.match(skill,/COMPANY_AUTH_REQUIRED/);
});
