import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
const fnStart=source.indexOf('function blogReaderReadyViolations');
assert.ok(fnStart>0,'blogReaderReadyViolations not found');
const fnEnd=source.indexOf('\n}\n',fnStart);
assert.ok(fnEnd>fnStart,'end of blogReaderReadyViolations not found');
const fn=source.slice(fnStart,fnEnd+3)
  .replace(/\(artifact:any\):string\[\]/,'(artifact)')
  .replace(/const errors:string\[\]=\[\]/,'const errors=[]');
const promptMatch=source.match(/const BLOG_READER_READY_PROMPT="((?:[^"\\]|\\.)*)";/);
assert.ok(promptMatch,'BLOG_READER_READY_PROMPT not found');
const ctx={String,RegExp,Array};
vm.createContext(ctx);
vm.runInContext(fn+';this.check=blogReaderReadyViolations;',ctx);

const filler='Een lezersgerichte alinea over het dagelijkse bedrijfsprobleem. '.repeat(40);
const art=(title,extra='')=>({title,cta:'Plan een kort gesprek over uw situatie.',body:`## Het probleem\n${filler}\n## Wat u kunt doen\n${filler}\n## Volgende stap\n${filler}\n${extra}`});

test('historical replay: blogs about the publish decision itself are rejected (25, 26, 27 Oct 2026)',()=>{
  assert.ok(ctx.check(art('Wanneer publiceren voor Circular Plastics NL? Een concreet beslisplan','')).includes('META_PUBLISHING_TOPIC'));
  assert.ok(ctx.check(art('Publiceren over de Circular Plastics NL-subsidie: een beslisframework','')).includes('META_PUBLISHING_TOPIC'));
  assert.ok(ctx.check(art('Publiceren voor de Circular Plastics NL-kans: beslis alleen als kanaal','')).includes('META_PUBLISHING_TOPIC'));
  assert.ok(ctx.check(art('Subsidie uitgelegd','Publiceer alleen als minimaal één kanaal de gates haalt.')).includes('INTERNAL_PUBLISHING_LANGUAGE'));
  assert.ok(ctx.check(art('Subsidie uitgelegd','Meet verified_qualified_cta_progression per kanaal.')).includes('INTERNAL_PUBLISHING_LANGUAGE'));
});

test('shadow: reader-facing blogs on real entrepreneur problems still pass',()=>{
  for(const title of [
    'Twinfield boekhouden: sluit je maandafsluiting en verlaag openstaande facturen',
    'Cyberdreigingen voor ondernemers: van signaal naar besluit in één gesprek',
    'Kennisverlies door personeelstekort: zo verbind je signalen aan concrete acties',
    'Zo publiceer je een betrouwbare offerte aan klanten'
  ]) assert.equal(JSON.stringify(ctx.check(art(title))),'[]',title);
});

test('canary: the writer prompt treats the recommendation as internal advice, not as the topic',()=>{
  const prompt=promptMatch[1];
  assert.match(prompt,/intern advies aan de uitgever, niet het onderwerp/);
  assert.match(prompt,/nooit over de vraag of, wanneer of hoe er over gepubliceerd moet worden/);
  assert.match(prompt,/kanaalgates, scores, CPC, forecast/);
  assert.match(prompt,/Geen redactienotities, publicatie-instructies/);
});
