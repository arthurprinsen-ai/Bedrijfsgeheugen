import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pages=['openai-ai-modellen','claude-ai-modellen','gemini-ai-modellen','mistral-ai-modellen','amazon-ai-modellen','chatgpt-vs-claude','chatgpt-vs-gemini','claude-vs-gemini'];

test('AI model v2 public pages use absolute internal hrefs',()=>{
 for(const slug of pages){
   const html=fs.readFileSync(`${slug}/index.html`,'utf8');
   assert.doesNotMatch(html,/href="\/(?!\/)/);
   assert.match(html,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/ai-modelwijzer"/);
 }
});

test('AI Modelwijzer v2 labels are present in fail-closed static EN cache',()=>{
 const cache=JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/2026-09-30-ai-modelwijzer-v2.json','utf8'));
 for(const source of ['Alle modalities','Alle doeleinden','Programmeren','Complex redeneren','Self-host / soevereiniteit']){
   assert.ok(cache[source],`missing translation: ${source}`);
 }
});

test('AI model cluster index pages are owned by the canonical shell projection',()=>{
 const shell=fs.readFileSync('tools/site-shell/apply-shell.mjs','utf8');
 const normalize=fs.readFileSync('tools/normaliseer-site-ui.mjs','utf8');
 for(const slug of pages){
   const file=slug+'/index.html';
   assert.ok(shell.includes(file),file+' missing from canonical shell discovery');
   assert.ok(normalize.includes(file),file+' missing from canonical normalization discovery');
 }
});
