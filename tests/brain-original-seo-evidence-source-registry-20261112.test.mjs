import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/powerhouse-seo-opportunity-resolver/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261112203500_original_seo_opportunity_source_registry_v1.sql',import.meta.url),'utf8');

test('original SEO opportunity writer has one exact pre-registered DERIVED source authority',()=>{
 assert.match(sql,/INSERT INTO public\.powerhouse_evidence_sources/);
 assert.match(sql,/'seo-opportunity-intelligence','projection',false,interval '7 days'/);
 assert.match(sql,/'powerhouse-seo-opportunity-resolver-v1'/);
 assert.match(sql,/'powerhouse-seo-opportunity-resolver'/);
 assert.match(sql,/ON CONFLICT \(source_key\) DO NOTHING/);
 assert.match(sql,/ORIGINAL_SEO_RESOLVER_SOURCE_OWNER_CONFLICT/);
 assert.match(sql,/source_class='projection'/);
 assert.match(sql,/required=false/);
 assert.doesNotMatch(sql,/cron\.schedule|CREATE TABLE|ALTER TABLE|DISABLE TRIGGER|GRANT .* TO anon|GRANT .* TO authenticated/i);
});
test('original resolver checks source registry before ANY write, unchanged service token remains enforced',()=>{
 const auth=source.indexOf("req.headers.get('x-powerhouse-token')!==expected");
 const owner=source.indexOf("SEO_ORIGINAL_SOURCE_OWNER_NOT_REGISTERED");
 const reader=source.indexOf("const [kwResult,gscResult");
 const upsert=source.indexOf("powerhouse_seo_keyword_intelligence_v1').upsert");
 const health=source.indexOf("const {error:hError}");
 const ack=source.indexOf("if(sourceObservationError)throw");
 assert.ok(auth>0&&auth<owner,'existing token gate remains first');
 assert.ok(owner>0&&owner<reader&&reader<upsert,'original source owner must be proven before source/forecast writes');
 assert.match(source,/\.from\('powerhouse_evidence_sources'\)/);
 assert.match(source,/\.eq\('source_key','seo-opportunity-intelligence'\)/);
 assert.match(source,/originalSource\.source_class!=='projection'/);
 assert.match(source,/originalSource\.writer_contract!==CONTRACT/);
 assert.match(source,/originalSource\.owner_component!=='powerhouse-seo-opportunity-resolver'/);
 assert.ok(ack>0&&health>ack,'fully accepted source observation must precede healthy end receipt');
});
test('no second scheduler, no provider impersonation, unknown visitor and CRO outcomes remain open',()=>{
 assert.match(source,/p_source_key:'seo-opportunity-intelligence'/);
 assert.match(source,/execution_readback:'EVIDENCE_DUE'/);
 assert.match(source,/source_projection:sourceProjectionReceipt/);
 assert.match(source,/new Date\(Date\.now\(\)-7\*86400000\)/);
 assert.doesNotMatch(sql,/source_key='dataforseo-intelligence'\s*\)/);
});
