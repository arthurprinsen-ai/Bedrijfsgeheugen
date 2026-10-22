import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ensurePublicationMarker } from '../tools/content-growth/publication-marker-build-guard.mjs';

test('v18 rebuild guard restores publication content id on the rebuilt body', () => {
  const built = '<!doctype html><html><body class="shell"><main>gebouwd</main></body></html>';
  const actual = ensurePublicationMarker(built, 'blog:ongeprijsd-probleem-bedrijfsvoering');

  assert.match(actual, /<body class="shell" data-content-id="blog:ongeprijsd-probleem-bedrijfsvoering">/);
});

test('v18 rebuild guard does not invent, duplicate or silently replace publication ids', () => {
  const built = '<html><body class="shell"><main>gebouwd</main></body></html>';
  assert.equal(ensurePublicationMarker(built, ''), built);

  const alreadyMarked = '<html><body class="shell" data-content-id="blog:voorbeeld"><main>gebouwd</main></body></html>';
  assert.equal(ensurePublicationMarker(alreadyMarked, 'blog:voorbeeld'), alreadyMarked);
  assert.throws(() => ensurePublicationMarker(alreadyMarked, 'blog:ander'), /conflicting publication marker/);
});

test('pricing shell pipeline restores canonical publication markers after all HTML normalizers', () => {
  const pipeline = fs.readFileSync('tools/prijzen-uit-de-homepage.mjs', 'utf8');
  assert.match(pipeline, /import \{ applyLedgerPublicationMarkers \} from '\.\/content-growth\/publication-marker-build-guard\.mjs';/);
  const validate = pipeline.indexOf('await validateSeoOrderEngine();');
  const guard = pipeline.indexOf('await applyLedgerPublicationMarkers();');
  assert.notEqual(validate, -1);
  assert.notEqual(guard, -1);
  assert.equal(guard > validate, true);
});

test('Netlify final published artifact repairs registered publication identities after every HTML normalizer', () => {
  const entry=fs.readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
  const guard=entry.indexOf('const publicationMarkers=await applyLedgerPublicationMarkers();');
  const full=entry.indexOf("if(error?.code==='ENOENT') await runFullBuild();");
  const prebuilt=entry.indexOf('await runPrebuiltReuse();');
  assert.ok(guard>full && guard>prebuilt,'last-pass guard must apply to full and prebuilt production builds');
  assert.match(entry,/NETLIFY_FINAL_PUBLICATION_MARKERS_PROVEN/);
  assert.match(entry,/import \\{ applyLedgerPublicationMarkers \\} from '..\\/content-growth\\/publication-marker-build-guard\\.mjs'/);
  assert.match(entry,/if\\(prepareArg\\)/,'do not touch cache-only translation preparation');
  const blog=fs.readFileSync('blog/aanzet-2026-emissieloze-trucks/index.html','utf8');
  assert.match(blog,/<body data-content-id="blog:aanzet-2026-emissieloze-trucks">/);
  assert.match(blog,/<meta name="bg-publication-identity" content="blog:aanzet-2026-emissieloze-trucks">/);
  assert.equal(ensurePublicationMarker(blog,'blog:aanzet-2026-emissieloze-trucks'),blog);
});

test('late production normalizer may erase marker, final proof restores it without fabricating unknown identities', () => {
  const built='<html><head><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/blog/foo/"></head><body class="normalized"><h1>Foo</h1></body></html>';
  const recovered=ensurePublicationMarker(built,'blog:foo');
  assert.match(recovered,/<body class="normalized" data-content-id="blog:foo">/);
  assert.throws(()=>ensurePublicationMarker(recovered,'blog:wrong'),/conflicting publication marker/);
  assert.equal(ensurePublicationMarker(built,''),built);
});
