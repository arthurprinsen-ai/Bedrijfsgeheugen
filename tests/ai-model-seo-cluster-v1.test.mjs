import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routes=[
 'openai-ai-modellen/index.html','amazon-ai-modellen/index.html','claude-ai-modellen/index.html','gemini-ai-modellen/index.html','mistral-ai-modellen/index.html',
 'chatgpt-vs-claude/index.html','chatgpt-vs-gemini/index.html','claude-vs-gemini/index.html'
];

test('AI model SEO cluster is substantive, canonical and routes into the Modelwijzer',()=>{
 for(const path of routes){
   const html=fs.readFileSync(path,'utf8');
   assert.match(html,/<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\//);
   assert.match(html,/Open de AI Modelwijzer/);
   assert.match(html,/<header\b[^>]*class="[^"]*bg-ai-header/);
   assert.match(html,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/ai-modelwijzer"/);
   assert.match(html,/Dataresidentie/);
   assert.match(html,/Data-soevereiniteit/);
   assert.ok(html.length>6000,`${path} must not be thin content`);
 }
 const sitemapSource=fs.readFileSync('tools/genereer-sitemap.mjs','utf8');
 for(const path of routes) assert.ok(sitemapSource.includes(path));
});