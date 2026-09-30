import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI Modelwijzer keeps interactive runtime through canonical V18 build',()=>{
  const builder=fs.readFileSync('tools/bouw-v18-chrome.mjs','utf8');
  assert.match(builder,/['"]ai-modelwijzer\.html['"]/);
  assert.match(builder,/EIGEN_WERKING/);
});

test('AI Modelwijzer static English cache is committed and substantial',()=>{
  const cache=JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/2026-09-30-ai-modelwijzer-production.json','utf8'));
  assert.ok(Object.keys(cache).length>=90);
  assert.equal(cache['Dataresidentie ≠ data-soevereiniteit.'],'Data residency ≠ data sovereignty.');
});

test('canonical website lane executes Modelwijzer regressions',()=>{
  const workflow=fs.readFileSync('.github/workflows/lane-website.yml','utf8');
  assert.match(workflow,/tests\/ai-model-advisor-v1\.test\.mjs/);
  assert.match(workflow,/tests\/brain-ai-modelwijzer-production-build-v1\.test\.mjs/);
});

test('AI Modelwijzer SEO routes keep a visible canonical header',()=>{
  const routes=[
    'openai-ai-modellen/index.html','claude-ai-modellen/index.html','gemini-ai-modellen/index.html',
    'mistral-ai-modellen/index.html','amazon-ai-modellen/index.html','chatgpt-vs-claude/index.html',
    'chatgpt-vs-gemini/index.html','claude-vs-gemini/index.html'
  ];
  for(const route of routes){
    const html=fs.readFileSync(route,'utf8');
    assert.match(html,/<header\b[^>]*class="[^"]*\bbg-ai-header\b[^"]*"/i,route);
    assert.match(html,/https:\/\/www\.bedrijfsgeheugen\.nl\/ai-modelwijzer/,route);
  }
});
