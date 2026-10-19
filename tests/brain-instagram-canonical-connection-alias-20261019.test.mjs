import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {selectVerifiedCanonicalInstagramConnection} from '../supabase/functions/_shared/composio-instagram-canonical-selection.mjs';

const candidate=(id,alias,username='bedrijfsgeheugen.nl')=>({accountId:id,account:{alias},identity:{id,username}});

test('selects one verified business identity with the currently connected canonical alias',()=>{
  const valid=candidate('good','bedrijfsgeheugen-nl-canonical');
  const other=candidate('other','legacy');
  const x=selectVerifiedCanonicalInstagramConnection([other,valid]);
  assert.equal(x.selectable.length,1);
  assert.equal(x.selectable[0].accountId,'good');
  assert.equal(x.canonical_alias_selected,true);
});

test('retains the historical Mira canonical alias',()=>{
  const x=selectVerifiedCanonicalInstagramConnection([candidate('mira','bedrijfsgeheugen-mira-canonical'),candidate('old','legacy')]);
  assert.equal(x.selectable[0].accountId,'mira');
  assert.equal(x.canonical_alias_selected,true);
});

test('fails closed when two approved aliases have provider-verified identities',()=>{
  const x=selectVerifiedCanonicalInstagramConnection([candidate('a','bedrijfsgeheugen-nl-canonical'),candidate('b','bedrijfsgeheugen-mira-canonical')]);
  assert.equal(x.selectable.length,2);
  assert.equal(x.canonical_alias_selected,false);
});

test('never selects an alias for a different Instagram identity',()=>{
  const x=selectVerifiedCanonicalInstagramConnection([candidate('wrong','bedrijfsgeheugen-nl-canonical','arthurprinsen'),candidate('right','legacy')]);
  assert.equal(x.selectable.length,1);
  assert.equal(x.selectable[0].accountId,'right');
  assert.equal(x.canonical_alias_selected,false);
});

test('leaves connections with no verified target identity unselected',()=>{
  assert.equal(selectVerifiedCanonicalInstagramConnection([candidate('other','bedrijfsgeheugen-nl-canonical','arthurprinsen')]).selectable.length,0);
});

test('production Instagram setup uses the verified selection helper',()=>{
  const source=readFileSync(fileURLToPath(new URL('../supabase/functions/powerhouse-composio-instagram-setup/index.ts',import.meta.url)),'utf8');
  assert.match(source,/selectVerifiedCanonicalInstagramConnection\(healthy\)/);
  assert.match(source,/canonical_alias_selected:selection\.canonical_alias_selected/);
});
