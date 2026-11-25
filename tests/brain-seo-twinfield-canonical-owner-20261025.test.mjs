import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readJson=path=>JSON.parse(readFileSync(path,'utf8'));
const source=readJson('site/seo-order-map.json');
const projection=readJson('supabase/functions/powerhouse-seo-opportunity-resolver/intent-owners.json');
const target='https://www.bedrijfsgeheugen.nl/twinfield-koppeling';
const aliases=['twinfield koppelingen','koppeling twinfield'];

test('GSC-observed Twinfield variants have exactly one canonical commercial owner in source and runtime',()=>{
  for(const registry of [source,projection]){
    const owner=registry.pages.find(page=>page.route===target);
    assert.ok(owner,'canonical Twinfield money page must exist');
    assert.equal(owner.role,'money');
    for(const alias of aliases){
      assert.ok(owner.secondary_keywords.includes(alias),'missing alias: '+alias);
      const claimants=registry.pages.filter(page=>page.primary_keyword===alias||page.secondary_keywords?.includes(alias));
      assert.deepEqual(claimants.map(page=>page.route),[target],'duplicate or missing owner: '+alias);
    }
  }
});

test('canonical source and resolver projection agree on Twinfield intent and retain live CTA',()=>{
  const ownerOf=registry=>registry.pages.find(page=>page.route===target);
  assert.deepEqual(ownerOf(source).secondary_keywords,ownerOf(projection).secondary_keywords);
  assert.ok(projection.generated_from.includes('site/seo-order-map.json'));
  const html=readFileSync('twinfield-koppeling.html','utf8');
  assert.match(html,/rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/twinfield-koppeling"/);
  assert.match(html,/data-money-primary href="\/frisse-blik"/);
});
