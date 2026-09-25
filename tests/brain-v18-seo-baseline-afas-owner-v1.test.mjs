import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const baseline=JSON.parse(fs.readFileSync('site/seo-baseline.json','utf8'));
const status=JSON.parse(fs.readFileSync('seo-status.json','utf8'));

test('V18 SEO baseline preserves every canonical keyword owner asserted by seo-status',()=>{
  const owners=new Map(baseline.keywordOwners.map(x=>[x.keyword,x.route]));
  for(const item of status.zoekwoorden){
    assert.equal(owners.get(item.zoekwoord),item.pagina,'SEO owner drift for '+item.zoekwoord);
  }
});
