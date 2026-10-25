import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ensurePublicationMarker} from '../tools/content-growth/publication-marker-build-guard.mjs';

const file='tools/ci/netlify-build-entry.mjs';
const article='blog/aanzet-2026-emissieloze-trucks/index.html';
const slug='aanzet-2026-emissieloze-trucks';
const id='blog:'+slug;
const source=readFileSync(file,'utf8');

test('historic Sep 28 blocked blog has immutable source identity and final build guard',()=>{
  const blog=readFileSync(article,'utf8');
  const ledger=JSON.parse(readFileSync('data/content-publication-ledger.json','utf8'));
  assert.equal(ledger.days['2026-09-28'].content_id,id);
  assert.equal(ledger.days['2026-09-28'].slug,slug);
  assert.match(blog,/<body data-content-id="blog:aanzet-2026-emissieloze-trucks">/);
  assert.match(blog,/<meta name="bg-publication-identity" content="blog:aanzet-2026-emissieloze-trucks">/);
  assert.equal(ensurePublicationMarker(blog,id),blog);
});

test('only existing Netlify build paths may produce terminal publication identity',()=>{
  assert.match(source,/import \{ applyLedgerPublicationMarkers \} from '\.\.\/content-growth\/publication-marker-build-guard\.mjs'/);
  const normalized=source.indexOf("['website-coherence','tools/site-shell/finalize-website-coherence-v1.mjs']");
  const last=source.indexOf('const publicationMarkers=await applyLedgerPublicationMarkers();');
  const build=source.indexOf("if(error?.code==='ENOENT') await runFullBuild();");
  const prebuilt=source.indexOf('await runPrebuiltReuse();');
  assert.ok(normalized>=0&&last>normalized&&last>build&&last>prebuilt);
  assert.match(source,/NETLIFY_FINAL_PUBLICATION_MARKERS_PROVEN/);
  assert.match(source,/if\(prepareArg\)/);
});

test('new normalizer-erased blog marker recovers; mismatched marker and missing body fail closed',()=>{
  const rebuilt='<html><body class="late-normalizer"><h1>Article</h1></body></html>';
  const corrected=ensurePublicationMarker(rebuilt,id);
  assert.match(corrected,/data-content-id="blog:aanzet-2026-emissieloze-trucks"/);
  assert.equal(ensurePublicationMarker(corrected,id),corrected);
  assert.throws(()=>ensurePublicationMarker(corrected,'blog:unrelated'),/conflicting publication marker/);
  assert.throws(()=>ensurePublicationMarker('<html><h1>Missing body</h1></html>',id),/body missing/);
  assert.equal(ensurePublicationMarker(rebuilt,''),rebuilt);
});
