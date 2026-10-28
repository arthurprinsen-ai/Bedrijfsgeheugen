import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {isNonProductionPath} from '../tools/site-shell/production-supersession.mjs';
const src=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const rpc=src.slice(src.indexOf('async function directRpc('),src.indexOf('\nfunction createDirectDb('));
const calls=[];
const run=new Function('DIRECT_RPCS','directSql','dbIdent','rpcExpr','normalizeJsonValue',stripTypeScriptTypes(rpc,{mode:'strip'})+'\nreturn directRpc;')(new Set(['bg_geheim']),{unsafe:async(sql,values)=>{calls.push({sql,values});return [{result:'synthetic-test-token'}];}},x=>'"'+x+'"',(v,values)=>{values.push(v);return '$'+values.length;},x=>x);
test('standalone authentication RPC uses the explicit executor without a receiver',async()=>{
 const r=await run('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'});assert.equal(r.error,null);assert.equal(r.data,'synthetic-test-token');assert.equal(calls.length,1);assert.deepEqual(calls[0].values,['powerhouse_daily_scheduler_token']);assert.match(calls[0].sql,/public\."bg_geheim"/);
});
test('RPC authorization allowlist remains fail closed',async()=>{const r=await run('unapproved_rpc',{});assert.match(r.error.message,/DB_RPC_REJECTED/);});
test('only exact reviewed-blog CI helper is classified as verifier and Edge remains runtime',()=>{
 assert.equal(isNonProductionPath('tools/content-growth/reviewed-blog-refresh.mjs'),true);assert.equal(isNonProductionPath('tools/content-growth/unknown-producer.mjs'),false);assert.equal(isNonProductionPath('supabase/functions/powerhouse-content-orchestrator/index.ts'),false);assert.equal(isNonProductionPath('tools/site-shell/publish_powerhouse_blog_artifact.py'),false);
});
