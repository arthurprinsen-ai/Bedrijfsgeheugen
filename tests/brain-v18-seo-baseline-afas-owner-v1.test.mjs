import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const baseline=JSON.parse(fs.readFileSync('site/seo-baseline.json','utf8'));
const order=JSON.parse(fs.readFileSync('site/seo-order-map.json','utf8'));

test('V18 SEO baseline preserves canonical AFAS keyword owner',()=>{
  const owners=new Map(baseline.keywordOwners.map(x=>[x.keyword,x.route]));
  assert.equal(owners.get('afas koppeling'),'/afas-koppeling');
  const canonical=order.pages.find(x=>x.primary_keyword==='afas koppeling');
  assert.ok(canonical);
  assert.equal(new URL(canonical.route).pathname,'/afas-koppeling');
});
