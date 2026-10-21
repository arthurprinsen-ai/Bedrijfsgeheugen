import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('final UI normalization runs before pricing and bedrijfslek integrity restore', () => {
  const config = fs.readFileSync('netlify.toml','utf8');
  const runner = fs.readFileSync('tools/ci/netlify-build-entry.mjs','utf8');

  // Production and deploy-preview must delegate to the same canonical runner.
  const commands = [...config.matchAll(/^\s*command\s*=\s*"node tools\/ci\/netlify-build-entry\.mjs"\s*$/gm)];
  assert.equal(commands.length, 2, 'production and preview must use the canonical Netlify build entrypoint');
  assert.match(config, /\[build\][\s\S]*?command\s*=\s*"node tools\/ci\/netlify-build-entry\.mjs"/);
  assert.match(config, /\[context\.deploy-preview\][\s\S]*?command\s*=\s*"node tools\/ci\/netlify-build-entry\.mjs"/);

  // Validate phases where they actually execute, not in the retired inline build command.
  const match = runner.match(/const phases = Object\.freeze\(\[([\s\S]*?)\n\]\);/);
  assert.ok(match, 'immutable build phases must exist');
  assert.match(runner, /for\(const \[name,script,\.\.\.args\] of phases\)/);
  assert.match(runner, /spawnSync\(process\.execPath,\[script,\.\.\.effectiveArgs\]/);
  assert.match(runner, /if\(result\.status!==0\) throw new Error\(/);

  const required = [
    ['site-ui','tools/normaliseer-site-ui.mjs'],
    ['pricing-restore','tools/site-shell/pricing-build-integrity.mjs','restore'],
    ['bedrijfslek-restore','tools/site-shell/bedrijfslek-build-integrity.mjs','restore'],
    ['i18n-assets','tools/site-shell/apply-i18n.mjs'],
    ['localized-routes','tools/site-shell/build-localized-routes.mjs']
  ];
  const locations = required.map(([name,script,arg]) => {
    const signature = "['" + name + "','" + script + "'" + (arg ? ",'" + arg + "'" : '') + ']';
    const index = match[1].indexOf(signature);
    assert.ok(index >= 0, name + ' must remain in the canonical Netlify phase sequence');
    assert.equal(match[1].indexOf(signature,index+1), -1, name + ' must run exactly once');
    return index;
  });
  for(let i=1;i<locations.length;i++) {
    assert.ok(locations[i-1]<locations[i],required[i-1][0] + ' must precede ' + required[i][0]);
  }
});
