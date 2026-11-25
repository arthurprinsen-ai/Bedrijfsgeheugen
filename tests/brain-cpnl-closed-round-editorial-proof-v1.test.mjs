import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('blog/circular-plastics-nl-cpnl-subsidie-40-miljoen-voor-onderzoek-en-showca/index.html','utf8');
const translations=JSON.parse(readFileSync('config/bg-static-i18n-en.d/2026-10-08-cpnl-publication.json','utf8'));
test('closed CP NL funding round is not presented as open',()=>{
 assert.match(html,/gesloten|afgelopen/i);
 assert.doesNotMatch(html,/vraag (nu|vandaag) (de )?subsidie aan/i);
});
test('closed-round editorial update has an English translation payload',()=>{
 assert.ok(Object.keys(translations).length>0);
});
