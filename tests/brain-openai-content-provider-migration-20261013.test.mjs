import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
const migration=readFileSync(new URL('../supabase/migrations/20261013132500_powerhouse_openai_content_governance_p0_4198.sql',import.meta.url),'utf8');
test('canonical content route requests OpenAI and existing secret',()=>{
 assert.match(source,/https:\/\/api\.openai\.com\/v1\/responses/);
 assert.match(source,/p_naam:'OPENAI_API_KEY'/);
 assert.match(source,/gov\.provider !== 'OpenAI'/);
 assert.match(migration,/use_case_id='supabase-bg-native-content-generate-v4'/);
 assert.match(migration,/provider='OpenAI'/);
});
test('no new publisher and external proof still required',()=>{
 assert.match(source,/powerhouse_content_closed_loop|powerhouse_channel_decisions|content_publication_obligations/);
 assert.match(source,/linkedin_personal/);
 assert.match(source,/editorialViolations/);
});

test('commercial composer uses the approved OpenAI route and retains the original quality checks',()=>{
 const composer=readFileSync(new URL('../supabase/functions/powerhouse-commercial-message-composer/index.ts',import.meta.url),'utf8');
 assert.match(composer,/https:\/\/api\.openai\.com\/v1\/responses/);
 assert.match(composer,/secret\(db,'OPENAI_API_KEY'\)/);
 assert.match(composer,/gov\.provider!=='OpenAI'/);
 assert.match(composer,/qv=quality\(/);
 assert.match(composer,/powerhouse_message_quality_v1/);
 assert.doesNotMatch(composer,/generated=await anthropicGenerate\(/);
});
