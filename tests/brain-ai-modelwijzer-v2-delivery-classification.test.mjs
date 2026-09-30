import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('AI Modelwijzer v2 public surfaces classify into the website lane', async()=>{
  const policy=JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));
  const changedPaths=[
    'ai-modelwijzer.html',
    'amazon-ai-modellen/index.html',
    'chatgpt-vs-claude/index.html',
    'chatgpt-vs-gemini/index.html',
    'claude-ai-modellen/index.html',
    'claude-vs-gemini/index.html',
    'data/ai-model-catalog-v1.json',
    'gemini-ai-modellen/index.html',
    'mistral-ai-modellen/index.html',
    'openai-ai-modellen/index.html'
  ];
  const plan=createDeliveryPlan({changedPaths,headSha:'decafbad12345678',policy});
  assert.deepEqual(plan.lanes.map(l=>l.id),['website']);
  assert.deepEqual(plan.changedPaths,[...changedPaths].sort());
});
