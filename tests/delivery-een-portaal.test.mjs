import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const REDIRECTS = readFileSync('_redirects','utf8');
const regels=()=>REDIRECTS.split('\n').map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));

test('Portal V2 is the only canonical customer portal entry surface',()=>{
  const tekst=regels().join('\n');
  assert.match(tekst,/^\/klantportaal\s+klant=demo\s+\/portaal\/demo\s+301!$/m);
  assert.match(tekst,/^\/klantportaal\s+klant=demo1\s+\/portaal\/demo\s+301!$/m);
  assert.match(tekst,/^\/klantportaal\s+klant=demoAI\s+\/portaal\/demo\s+301!$/m);
  assert.match(tekst,/^\/klantportaal\s+klant=:klant\s+\/portaal\/:klant\s+301!$/m);
  assert.match(tekst,/^\/portaal\/\*\s+\/portal-v2\/:splat\s+200!$/m);
  assert.doesNotMatch(tekst,/\/klantportaal\.html\s+200!/);
});

test('old portal codepaths never become visitor destinations',()=>{
  const fout=regels().filter(regel=>{
    const delen=regel.split(/\s+/);
    const doel=delen.find((deel,index)=>index>0&&deel.startsWith('/'));
    return doel==='/portal/'||doel?.startsWith('/portal/')||doel?.startsWith('/portal-next/');
  });
  assert.deepEqual(fout,[]);
});

test('old portal aliases still resolve into Portal V2',()=>{
  const tekst=regels().join('\n');
  assert.match(tekst,/^\/portal\/\*\s+\/portal-v2\/\s+301!$/m);
  assert.match(tekst,/^\/portal-next\/\*\s+\/portal-v2\/\s+301!$/m);
  assert.match(tekst,/^\/portaal\s+\/portal-v2\/\s+301!$/m);
});
