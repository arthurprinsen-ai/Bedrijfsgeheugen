import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as childProcess from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('publisher extracts cache only after all canonical SEO transformations', () => {
  const entry=fs.readFileSync(path.join(REPO,'tools/ci/netlify-build-entry.mjs'),'utf8');
  const publisher=fs.readFileSync(path.join(REPO,'.github/workflows/powerhouse-daily-blog.yml'),'utf8');
  const gate=fs.readFileSync(path.join(REPO,'.github/workflows/required-test.yml'),'utf8');
  assert.ok(entry.indexOf("'seo-apply'") < entry.indexOf("'localized-routes'"));
  assert.match(entry,/cacheOnlyPatch && name==='localized-routes'/);
  assert.match(entry,/NETLIFY_I18N_CACHE_PREPARED/);
  assert.match(publisher,/--prepare-i18n-cache="powerhouse-blog-\$DATE\.json"/);
  const createCandidate=publisher.indexOf('      - name: Create exactly one protected candidate');
  const prepare=publisher.indexOf('          STATIC_I18N_NETWORK=1 node tools/ci/netlify-build-entry.mjs',createCandidate);
  const createPr=publisher.indexOf('            gh pr create --base main',createCandidate);
  assert.ok(createCandidate>=0 && prepare>createCandidate && createPr>prepare,
    'all English strings are prepared before opening the PR');
  assert.ok(publisher.includes('git commit --amend --no-edit'));
  assert.match(publisher,/STATIC_I18N_REQUIRE_CACHE=1/);
  assert.match(publisher,/steps\.i18n\.outcome == 'success'/);
  assert.match(gate,/node --test tests\/brain-powerhouse-blog-i18n-prepublish\.test\.mjs/);
});

test('scoped patch cache is durable and complete before merge, not a global rewrite', () => {
  const source=fs.readFileSync(path.join(REPO,'tools/site-shell/build-localized-routes.mjs'),'utf8');
  assert.match(source,/const PREPARE_CACHE_ARG = process\.argv\.find/);
  assert.match(source,/if \(PREPARE_CACHE_PATCH_NAME\)/);
  assert.match(source,/Object\.fromEntries\(Object\.entries\(cache\)/);
  assert.match(source,/TRANSLATION_CACHE_PATCH_DIR,PREPARE_CACHE_PATCH_NAME/);
  assert.match(source,/STATIC_I18N_PREPARE_INCOMPLETE/);
  assert.doesNotMatch(source,/fs\.existsSync\(file\)/,
    'read the patch atomically without a separate existence check');
  assert.match(source,/error\?\.code !== 'ENOENT'/,
    'only a missing patch is recoverable; malformed and inaccessible files stay fatal');
  assert.match(source,/process\.exit\(0\)/);
});

test('Powerhouse blog rejects editor-only source copy before protected publication', () => {
  const {spawnSync} = childProcess;
  const python = [
    "import importlib.util",
    "spec=importlib.util.spec_from_file_location('publisher', 'tools/site-shell/publish_powerhouse_blog_artifact.py')",
    "publisher=importlib.util.module_from_spec(spec)",
    "spec.loader.exec_module(publisher)",
    "body=('Externe signalen vragen om een controleerbaar besluit, met eigenaar en meetpunt. ' * 16)",
    "def check(title, text, cta, expected=None):",
    "    try:",
    "        publisher.assert_reader_ready({'title':title,'body':text,'cta':cta})",
    "        assert expected is None, f'expected failure: {expected}'",
    "    except SystemExit as exc:",
    "        assert expected is not None and expected in str(exc), f'unexpected: {exc}'",
    "check('Externe signalen naar besluiten', body, 'Bekijk de Frisse blik')",
    "check('Externe signalen naar besluiten', 'Voordat u publiceert: voer eerst een URL-check uit.\\n' + body, 'Bekijk de Frisse blik', 'PUBLISH_FIRST_INSTRUCTION')",
    "check('Externe signalen naar besluiten', body+'\\nPublicatiestap (vereist vóór live)\\n1) publiceer', 'Bekijk de Frisse blik', 'RELEASE_STEP')",
    "check('Externe signalen (canonieke pagina)', body, 'Bekijk de Frisse blik', 'TITLE_DRAFT_MARKER')",
    "check('Externe signalen', body, 'Voer eerst een canonieke URL-eigenaarschap-check uit', 'CTA_PUBLISH_INSTRUCTION')",
    "print('BLOG_READER_READY_GUARD_OK')",
  ].join('\n');
  const result=spawnSync('python3',['-c',python],{cwd:REPO,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr || result.stdout);
  assert.match(result.stdout,/BLOG_READER_READY_GUARD_OK/);
});
