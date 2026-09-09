import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const preview=fs.readFileSync(new URL('../portal-next/index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../portal-next/portal-next.js',import.meta.url),'utf8');

/**
 * Deze gates bewaken één ding: de preview op /portal-next mag nooit overkomen
 * als actieve bedrijfswaarheid, en demo-data mag nooit stilzwijgend aangaan.
 *
 * De oude asserties toetsten op exacte zinnen ('geen productieclaim',
 * 'Toon demo-route') en op de letterlijke broncode van selectSource en
 * selectModule. Die teksten zijn hernoemd en de functies zijn juist strenger
 * geworden: ze zetten demoMode nu expliciet op false. De bewaking toetst
 * daarom nu de bedoeling en de structuur, niet de formulering.
 */

test('preview noemt de voorbeeldstatus expliciet',()=>{
  assert.match(preview,/voorbeelddata/i);
  assert.match(preview,/geen actieve bedrijfswaarheid|geen productieclaim/i);
});

test('idle is default en de voorbeeldroute is een expliciete keuze',()=>{
  assert.match(js,/let demoMode\s*=\s*false/);
  assert.match(preview,/id="demoRoute"/);
});

test('bron of module selecteren zet demo mode niet impliciet aan',()=>{
  for(const fn of ['selectSource','selectModule']){
    const start=js.indexOf(`export function ${fn}(id){`);
    const match=start<0?null:[js.slice(start,js.indexOf('\n',start))];
    assert.ok(match,`${fn} niet gevonden`);
    assert.doesNotMatch(match[0],/demoMode\s*=\s*true/,`${fn} zet demo mode aan`);
    assert.match(match[0],/demoMode\s*=\s*false/,`${fn} zet demo mode niet expliciet uit`);
  }
  assert.equal(js.includes('if(!demoMode)demoMode=true'),false);
});

test('geen hardcoded productie verified/completed status tokens',()=>{
  for(const token of ['data-runtime-status="verified" data-static="true"','data-agent-status="completed" data-static="true"'])
    assert.equal(preview.includes(token),false);
});

test('mobiele reduced-motion gate bestaat',()=>{
  const css=fs.readFileSync(new URL('../portal-next/portal-next.css',import.meta.url),'utf8');
  assert.ok(css.includes('prefers-reduced-motion'));
});
