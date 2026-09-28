import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('One Brain and continuity skill enforce Netlify terminal self-healing',async()=>{
  const [cfgText,skill,learningText,doc,ledger]=await Promise.all([
    read('config/powerhouse-one-loop-v1.json'),
    read('.agents/skills/powerhouse-continuity/SKILL.md'),
    read('brain/learning/2026-09-28-netlify-terminal-self-heal-v1.json'),
    read('docs/changes/2026-09-28-netlify-terminal-self-heal-v1.md'),
    read('docs/development-ledger-events/2026-09-28-netlify-terminal-self-heal-v1.md')
  ]);
  const cfg=JSON.parse(cfgText);
  const rule=cfg.oneBrainConstitution.netlifyTerminalSelfHealing;
  const learning=JSON.parse(learningText);
  assert.equal(rule.fingerprint,'delivery|netlify-terminal-self-heal|v1');
  assert.equal(rule.authority,'CURRENT_PROTECTED_MAIN_PLUS_PROVIDER_READBACK');
  assert.equal(rule.staleTargetPolicy,'SAFE_SUPERSESSION_BEFORE_RETRY');
  assert.equal(rule.expiredTransportPolicy,'REACQUIRE_ONCE_THEN_PROVIDER_READBACK');
  assert.equal(rule.noPendingFinalHandoff,true);
  for(const k of ['chats','agents','skills','workflows','futureCapabilities']) assert.equal(rule.inheritance[k],true,k);
  assert.ok(skill.includes('## Netlify terminal self-healing'));
  assert.equal(learning.compiler.failure_class,'NETLIFY_STALE_TARGET_OR_EXPIRED_TRANSPORT');
  assert.ok(doc.includes('current GitHub `main`'));
  assert.ok(ledger.includes('no pending final handoff'));
});
