import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {declaredFunctions,resolveEdgeRuntimeFunctions} from '../tools/supabase/edge-runtime-scope.mjs';

const config=readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8');
const research=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
const helper=readFileSync(new URL('../supabase/functions/_shared/relationship-research-feedback.mjs',import.meta.url),'utf8');
const slug='powerhouse-relationship-public-research';
const section=/^\[functions\.powerhouse-relationship-public-research\]\n(?:[^\[]|\[(?!functions\.))*?(?=^\[functions\.|\Z)/ms;

test('the SAME existing original DataForSEO research worker is registered for GitHub Integration production',()=>{
 assert.equal((config.match(/^\[functions\.powerhouse-relationship-public-research\]$/gm)||[]).length,1);
 assert.ok(declaredFunctions(config).includes(slug));
 assert.match(config,/\[functions\.powerhouse-relationship-public-research\]\s*(?:#[^\n]*\n)*enabled\s*=\s*true\s*\nverify_jwt\s*=\s*false\s*\nentrypoint\s*=\s*"\.\/functions\/powerhouse-relationship-public-research\/index\.ts"/);
 assert.match(research,/researchNoSourceFeedback/);
 assert.match(research,/\.in\('status',\['prepared','waiting'\]\)/);
 assert.match(research,/x-powerhouse-token/);
 assert.match(research,/db\.rpc\('bg_geheim'/);
 assert.doesNotMatch(research,/GMAIL_SEND_EMAIL|GMAIL_CREATE_DRAFT|cron\.schedule\s*\(/i);
});

test('production configuration delta deploys only the old research worker, never all Edge functions',()=>{
 const match=config.match(section);
 assert.ok(match,'new exact local function section');
 const before=config.replace(section,'');
 assert.ok(!declaredFunctions(before).includes(slug));
 const scope=resolveEdgeRuntimeFunctions({
  changedPaths:['supabase/config.toml'],configText:config,baseConfigText:before
 });
 assert.deepEqual(scope,[slug],'only this existing original research Edge may be redeployed');
 assert.ok(declaredFunctions(config).includes('powerhouse-mira-problem-radar'));
});

test('the worker never grants Gmail authority from a source result or repeats uncertain messages',()=>{
 assert.match(helper,/provider_send_authorized:false/);
 assert.match(helper,/message_quality_approved:false/);
 assert.match(helper,/source_page_independently_read:false/);
 assert.match(helper,/freshness_verified:false/);
 assert.match(helper,/external_send_executed:false/);
 assert.match(research,/NO_VERIFIED_SOURCE_IN_BOUNDED_ORIGINAL_SEARCH/);
 assert.match(research,/ORIGINAL_NO_SOURCE_OWNER_WRITEBACK/);
});
