import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit=fs.readFileSync('.github/scripts/seocontrole.py','utf8');
const expected={
  'ai-act.html':'EU AI Act mkb',
  'ai-implementeren.html':'AI implementatie mkb',
  'ai-poc.html':'AI POC mkb',
  'bedrijfsgeheugen.html':'Bedrijfskennis borgen',
  'blog/index.html':'Digitalisering mkb kennisbank',
  'due-diligence.html':'Due diligence bedrijfskennis',
  'investeerders-ma.html':'Bedrijfskennis bij overname',
  'prijzen.html':'Kosten digitalisering mkb',
  'product.html':'Bedrijfsgeheugen platform',
  'systemen-koppelen.html':'Systemen koppelen mkb',
  'webshop-koppeling.html':'Webshop koppeling mkb'
};

test('high-severity SEO owners claim their primary intent in source titles',()=>{
  for(const [path,keyword] of Object.entries(expected)){
    const html=fs.readFileSync(path,'utf8');
    const title=(html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||'';
    assert.ok(title.toLowerCase().includes(keyword.toLowerCase()),path);
  }
});

test('legacy audit treats explicit keyword ownership as exact',()=>{
  assert.ok(audit.includes("if expliciet:"));
  assert.ok(audit.includes("return expliciet == norm(zoekwoord)"));
});

test('canonical aliases are not required as independent sitemap URLs',()=>{
  assert.ok(audit.includes("canonical_path = urlparse(p.get('canon', '')).path.rstrip('/') or '/'"));
  assert.ok(audit.includes("if p.get('canon') and canonical_path != current_path:"));
});
