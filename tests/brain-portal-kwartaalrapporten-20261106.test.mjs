import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderEditions,sortEditions,mountKwartaalrapporten} from '../portal-v2/modules/kwartaalrapporten.js';

const manifest=JSON.parse(fs.readFileSync('portal-v2/reports/manifest.json','utf8'));
const onDisk=url=>fs.existsSync(url.replace(/^\/portal-v2\//,'portal-v2/'));

test('elke editie in het manifest verwijst naar bestanden die bestaan en een echt PDF zijn',()=>{
  assert.ok(manifest.editions.length>=1);
  for(const e of manifest.editions){
    assert.ok(onDisk(e.pdf),e.pdf);assert.ok(onDisk(e.data),e.data);
    assert.equal(fs.readFileSync(e.pdf.replace(/^\/portal-v2\//,'portal-v2/')).subarray(0,5).toString(),'%PDF-');
    assert.equal(fs.statSync(e.pdf.replace(/^\/portal-v2\//,'portal-v2/')).size,e.pdfBytes);
  }
});

test('de pagina toont de nieuwste editie eerst met werkende downloadlinks en ontsnapt tekst',()=>{
  const m={editions:[{id:'a',quarter:'2026-Q3',title:'Oud',pdf:'/portal-v2/reports/a.pdf'},{id:'b',quarter:'2026-Q4',title:'<b>Nieuw</b>',pdf:'/portal-v2/reports/b.pdf',data:'https://evil.example/x'}]};
  assert.deepEqual(sortEditions(m).map(e=>e.id),['b','a']);
  const html=renderEditions(m);
  assert.ok(html.indexOf('2026-Q4')<html.indexOf('2026-Q3'));
  assert.match(html,/href="\/portal-v2\/reports\/b\.pdf" download/);
  assert.doesNotMatch(html,/evil\.example/);
  assert.doesNotMatch(html,/<b>Nieuw<\/b>/);
  assert.match(renderEditions({editions:[]}),/nog geen kwartaalrapport/);
});

test('de pagina laadt het echte manifest en rendert elke editie',async()=>{
  const made=[];
  const root={ownerDocument:{createElement:()=>{const n={innerHTML:'',textContent:'',setAttribute(){}};made.push(n);return n;}},querySelector:()=>null,appendChild(){}};
  await mountKwartaalrapporten(root,{fetchFn:async()=>({ok:true,json:async()=>manifest})});
  for(const e of manifest.editions)assert.match(made[1].innerHTML,new RegExp(`data-edition="${e.id}"`));
  await mountKwartaalrapporten(root,{fetchFn:async()=>({ok:false,status:500})});
  assert.match(made.at(-1).innerHTML,/konden niet worden geladen/);
});

test('de pagina hangt in registry, shell en plantoegang',()=>{
  const r=fs.readFileSync('portal-v2/page-registry.js','utf8'),s=fs.readFileSync('portal-v2/page-shell.js','utf8'),p=fs.readFileSync('portal-v2/plan-access.js','utf8');
  assert.match(r,/'kwartaalrapporten'/);assert.match(r,/kwartaalrapporten:\{label:'Kwartaalrapporten'\}/);
  assert.match(s,/pageId==='kwartaalrapporten'/);assert.match(s,/kwartaalrapporten:\['Kwartaalrapporten'/);
  assert.match(p,/'kwartaalrapporten':'starter'/);
});
