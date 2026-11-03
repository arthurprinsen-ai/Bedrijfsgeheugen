import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalEditorialViolations} from '../supabase/functions/_shared/personal-linkedin-editorial-contract.mjs';
const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');

test('original OpenAI response adapter uses low reasoning only when explicitly enabled for personal editorial',()=>{
 assert.match(source,/async function callAI\([^\n]+reasoningEffort\?: 'low'\)/);
 assert.match(source,/reasoningEffort\?\{reasoning:\{effort:reasoningEffort\}\}:\{\}/);
 assert.match(source,/initialBudget,pending\.channel==='linkedin_personal'\?'low':undefined/);
 assert.match(source,/retryBudget,pending\.channel==='linkedin_personal'\?'low':undefined/);
 assert.match(source,/correctionPrompt,revisionInput,artifactTool,budget,'low'/);
});
test('original rejected-personal retry uses concise source-locked instruction and no repeated full system',()=>{
 const start=source.indexOf('const correctionPrompt =');
 const end=source.indexOf('// Editorial revisions need',start);
 assert.ok(start>0&&end>start);
 const block=source.slice(start,end);
 assert.ok(block.length<2200,'bounded revision instruction size');
 assert.doesNotMatch(block,/correctionPrompt = editorialSystem/);
 assert.match(block,/verified_personal_source:personalSource/);
 assert.match(block,/rejected_draft:bodyText/);
 assert.match(block,/150 tot 175 normale Nederlandse woorden/);
 assert.match(block,/verzin nooit klanten/);
 assert.match(block,/exact één oprechte open vraag/);
});
test('original publisher authority, duplicate and truth gates remain enabled',()=>{
 for(const required of ['personalEditorialViolations(bodyText','personalFinalCopyValid(bodyText','recoverableObligationUniquenessDenial','consumedCapabilityChannels'])assert.ok(source.includes(required),required);
 assert.doesNotMatch(source,/DISABLE_DUPLICATE_GATE|ALLOW_FAKE_PROVIDER_ID|SKIP_EDITORIAL_VALIDATION/);
});
test('unsent fake low-evidence editorial text stays rejected by real deterministic editorial gate',()=>{
 const rejected='Ik wil dat AI meer doet. 273 pagina’s, 30 bronnen en 280 acties. Nieuwe interne status, nog geen ondernemerprobleem.';
 const codes=personalEditorialViolations(rejected,{ai_native_builder_story_verified:true}).map(v=>v.code);
 assert.ok(codes.includes('PERSONAL_EDITORIAL_WORD_COUNT'));
 assert.ok(codes.includes('PERSONAL_EDITORIAL_GENERIC_AI_HOOK'));
 assert.ok(codes.includes('PERSONAL_EDITORIAL_INTERNAL_METRICS_REPORT'));
});

test('original personal Edge worker must have exactly one revisionInput binding (real 503 startup regression)',()=>{
 const declarations=[...source.matchAll(/\bconst\s+revisionInput\s*=/g)].length;
 assert.equal(declarations,1,'DUPLICATE_PERSONAL_REVISION_INPUT_EDGE_BOOT_503');
 const revision=source.indexOf('const revisionInput={');
 const retry=source.indexOf('const revision=await retryIncompleteEditorialDraft(',revision);
 assert.ok(revision>0 && retry>revision,'one source-locked revision binding is in scope');
 assert.match(source.slice(revision,retry),/verified_personal_source:personalSource/);
});
