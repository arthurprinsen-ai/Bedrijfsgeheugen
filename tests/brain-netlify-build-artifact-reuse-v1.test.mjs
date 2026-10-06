import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(path, 'utf8');

test('one canonical Netlify build runner owns production, preview and Required parity', async () => {
  const [config, required, runner] = await Promise.all([
    read('netlify.toml'),
    read('.github/workflows/required-test.yml'),
    read('tools/ci/run-netlify-production-build.mjs'),
  ]);
  const command = 'node tools/ci/run-netlify-production-build.mjs';
  assert.equal(config.split(command).length - 1, 2);
  assert.match(required, /Run exact Netlify production build command once[\s\S]*run: node tools\/ci\/run-netlify-production-build\.mjs/);
  assert.match(runner, /Promise\.all\(commands\.map/);
  assert.match(runner, /phase\('capture-integrity'/);
  assert.match(runner, /phase\('restore-integrity'/);
  assert.match(runner, /normalize-site-ui[\s\S]*restore-integrity[\s\S]*seo-order-apply/);
});

test('Required creates exact-tree cached prebuilt output for downstream reuse', async () => {
  const workflow = await read('.github/workflows/required-test.yml');
  assert.match(workflow, /git rev-parse 'HEAD\^\{tree\}'/);
  assert.match(workflow, /key: netlify-prebuilt-v1-/);
  assert.match(workflow, /netlify-prebuilt-manifest\.json/);
  assert.match(workflow, /source_tree_sha/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /netlify-prebuilt-\$\{\{ steps\.source\.outputs\.tree_sha \}\}/);
  assert.match(workflow, /compression-level:\s*0/);
});

test('production deployment reuses only exact-tree successful Required artifacts', async () => {
  const workflow = await read('.github/workflows/production-source-snapshot.yml');
  assert.match(workflow, /actions:\s*read/);
  assert.match(workflow, /pull-requests:\s*read/);
  assert.match(workflow, /commits\/\$GITHUB_SHA\/pulls/);
  assert.match(workflow, /actions\/workflows\/required-test\.yml\/runs/);
  assert.match(workflow, /netlify-prebuilt-/);
  assert.match(workflow, /source_tree_sha/);
  assert.match(workflow, /NETLIFY_PREBUILT_REUSE/);
  assert.match(workflow, /PREBUILT_TREE_MISMATCH/);
  assert.match(workflow, /stamp-release-identity\.mjs/);
});

test('release identity stamping is separable from expensive site transforms', async () => {
  const [full, stamp] = await Promise.all([
    read('tools/bouw-release-evidence.mjs'),
    read('tools/site-shell/stamp-release-identity.mjs'),
  ]);
  assert.match(full, /stampReleaseIdentity/);
  assert.match(stamp, /ensureReleaseMarker/);
  assert.match(stamp, /resolveReleaseCommitRef/);
  assert.match(stamp, /release\.json/);
  assert.doesNotMatch(stamp, /applyConversionCta|finalizeSiteContracts|applyMoneyPrerender/);
});
