import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Read-only, fail-closed oracle for actual production and preview build execution.
export function canonicalNetlifyBuild() {
  const toml = readFileSync('netlify.toml','utf8');
  const entry = readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
  assert.match(toml,/\[build\][\s\S]*?command\s*=\s*"node tools\/ci\/netlify-build-entry\.mjs"/);
  assert.match(toml,/\[context\.deploy-preview\][\s\S]*?command\s*=\s*"node tools\/ci\/netlify-build-entry\.mjs"/);
  assert.match(entry,/for\(const \[name,script,\.\.\.args\] of phases\)/);
  assert.match(entry,/spawnSync\(process\.execPath,\[script,\.\.\.effectiveArgs\]/);
  assert.match(entry,/if\(result\.status!==0\) throw new Error/);
  const section=entry.match(/const phases = Object\.freeze\(\[([\s\S]*?)\n\]\);/);
  assert.ok(section,'canonical phase list missing');
  const phases=[...section[1].matchAll(/^\s*\['([^']+)','([^']+)'((?:,'[^']+')*)\],?\s*$/gm)].map(m=>({
    name:m[1], script:m[2], args:[...m[3].matchAll(/'([^']+)'/g)].map(a=>a[1]),
  }));
  assert.ok(phases.length>=25,'canonical phase list truncated');
  assert.equal(new Set(phases.map(p=>p.name)).size,phases.length,'duplicate phase');
  return {toml,entry,phases};
}
export function phaseIndex(phases,name,script,args=[]) {
  const i=phases.findIndex(p=>p.name===name&&p.script===script&&JSON.stringify(p.args)===JSON.stringify(args));
  assert.ok(i>=0,`missing actual build phase: ${name} (${script})`);
  return i;
}
