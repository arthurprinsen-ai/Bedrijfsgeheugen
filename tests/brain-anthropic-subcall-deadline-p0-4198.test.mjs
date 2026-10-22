import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const creator = read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const supervisor = read('supabase/functions/powerhouse-content-loop/index.ts');

// The original 90s Anthropic / 110s supervisor deadline is still binding.
// The retired MAX_CHANNEL_GENERATIONS/bootstrapAttempted source oracle is
// replaced by the actual single-lease, bounded per-channel safety contract.
const supervisorGuards = [
  ['single existing lease', /if\s*\(!leaseAcquired\)\s*return\s+json\(\{\s*ok:true,\s*runDate,\s*skipped:true,\s*reason:'ALREADY_RUNNING'\s*\},\s*202\)/],
  ['four canonical channels', /const\s+requiredDecisionChannels\s*=\s*\['linkedin_personal',\s*'linkedin_company',\s*'instagram_company',\s*'blog'\]/],
  ['maximum four pending channels', /\.in\('channel',\s*requiredDecisionChannels\)\s*\.limit\(4\)/],
  ['deduplicated pending channel set', /const\s+pendingChannels\s*=\s*\[\.\.\.new\s+Set\(\(pendingGeneration\|\|\[\]\)\.map\(\(item:any\)=>clean\(item\.channel\)\)\)\]/],
  ['allowlisted selected channels', /\.filter\(channel\s*=>\s*requiredDecisionChannels\.includes\(channel\)\)/],
  ['bounded per-channel fanout', /Promise\.all\(pendingChannels\.map\(async\s+channel\s*=>\s*\{/],
  ['exact channel-scoped invocation', /invoke\(url,\s*expected,\s*'powerhouse-content-orchestrator',\s*\{runDate,\s*channel\}\)/],
  ['unknown bootstrap result stays in-flight', /bootstrapStillInFlight\s*=\s*seeded\.timed_out\s*===\s*true\s*\|\|\s*seeded\.http\s*===\s*0/],
  ['no second pass on ambiguous bootstrap', /else\s+if\s*\(!bootstrapStillInFlight\)/]
];
const creatorGuards = [
  ['child allowlist', /const\s+allowedChannelScopes\s*=\s*new Set\(\['linkedin_personal',\s*'linkedin_company',\s*'instagram_company',\s*'blog'\]\)/],
  ['unknown channel denied', /if\s*\(channelScope\s*&&\s*!allowedChannelScopes\.has\(channelScope\)\)\s*return\s+json\(\{ok:false,\s*error:'UNKNOWN_CHANNEL_SCOPE'\},\s*400\)/],
  ['scoped database selection', /channelScope\s*\?\s*pendingQuery\.eq\('channel',\s*channelScope\)\s*:\s*pendingQuery/]
];
function verify(source, guards) {
  for (const [label, pattern] of guards) assert.match(source, pattern, label);
}

test('Anthropic request deadline fits inside supervisor and canonical bounded multi-channel generation', () => {
  assert.match(creator, /AbortSignal\.timeout\(90_000\)/);
  assert.match(supervisor, /'powerhouse-content-orchestrator':\s*110_000/);
  verify(supervisor, supervisorGuards);
  verify(creator, creatorGuards);
});

test('twelve mutation-negative guards reject lease, fanout, dedupe and channel scope weakening', () => {
  for (const [source, guards] of [[supervisor, supervisorGuards], [creator, creatorGuards]]) {
    for (const [label, pattern] of guards) {
      const modified = source.replace(pattern, '/* negative canary: ' + label + ' removed */');
      assert.notEqual(modified, source, label + ' mutation must execute');
      assert.throws(() => verify(modified, guards), {code:'ERR_ASSERTION'}, label);
    }
  }
});

test('social output remains concise, source bound and identity checked', () => {
  assert.equal(creator.includes("pending.channel==='blog'?4800:2600"), false);
  assert.match(creator, /pending\.channel==='blog'\?4800:1800/);
  assert.match(creator, /PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED/);
  assert.match(creator, /const finalTextHash = await digest\(bodyText\)/);
  assert.match(creator, /callAI\(apiKey,gov\.model_id/);
  assert.match(creator, /composioFallbackEligible\(error\)/);
});
