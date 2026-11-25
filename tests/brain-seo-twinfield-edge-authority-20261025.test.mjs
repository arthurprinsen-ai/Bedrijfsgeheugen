import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config=readFileSync('supabase/config.toml','utf8');
const resolver=readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/index.ts','utf8');
const owners=JSON.parse(readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/intent-owners.json','utf8'));

test('canonical Twinfield resolver is declared for protected Supabase Edge deployment',()=>{
  const markers=[...config.matchAll(/^\[functions\.powerhouse-seo-opportunity-resolver\]$/gm)];
  assert.equal(markers.length,1,'exactly one Edge function declaration');
  const section=config.slice(markers[0].index+markers[0][0].length).split(/^\[/m)[0];
  assert.match(section,/^enabled\s*=\s*true\s*$/m);
  assert.match(section,/^verify_jwt\s*=\s*false\s*$/m);
  assert.match(section,/^entrypoint\s*=\s*"\.\/functions\/powerhouse-seo-opportunity-resolver\/index\.ts"\s*$/m);
});

test('non-JWT transport retains real scheduler-token authorization and one Twinfield owner',()=>{
  assert.match(resolver,/x-powerhouse-token/);
  assert.match(resolver,/UNAUTHORIZED/);
  const target='https://www.bedrijfsgeheugen.nl/twinfield-koppeling';
  for(const alias of ['twinfield koppelingen','koppeling twinfield']){
    const matches=owners.pages.filter(page=>page.primary_keyword===alias||page.secondary_keywords?.includes(alias));
    assert.deepEqual(matches.map(page=>page.route),[target]);
  }
});
