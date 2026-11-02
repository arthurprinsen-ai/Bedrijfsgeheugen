import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const files=['.github/workflows/weekblog.yml','.github/workflows/blog-bijwerken.yml'];
const load=p=>readFileSync(p,'utf8');
for(const path of files){
 test(path+' runs original Codex authoring on supported Ubuntu 24.04 without reducing sandbox isolation',()=>{
  const source=load(path);
  assert.match(source,/^    runs-on: ubuntu-24\.04$/m);
  assert.doesNotMatch(source,/runs-on: ubuntu-latest/);
  assert.match(source,/uses: openai\/codex-action@bdf19a4a223ec2549a3e2274a0cf61556bc07675/);
  assert.match(source,/permission-profile: ":workspace"/);
  assert.match(source,/openai-api-key: \$\{\{ secrets\.OPENAI_API_KEY \}\}/);
  assert.doesNotMatch(source,/safety-strategy: (?:unsafe|read-only)/);
  assert.doesNotMatch(source,/sandbox: danger-full-access|OPENAI_API_KEY: .*\$\{\{ github\./);
  assert.match(source,/concurrency:\s*\n\s*group: repo-schrijven/);
  assert.match(source,/name: Deterministic (?:publication|update) contract checks/);
  assert.match(source,/name: Candidate PR openen/);
  assert.doesNotMatch(source,/git push origin HEAD:main|git push --force/);
 });
}
test('original editorial skill links upstream source, original incident and release-quality proof',()=>{
 const skill=load('.agents/skills/powerhouse-cms-editorial/SKILL.md');
 assert.match(skill,/powerhouse\|blog\|codex-action-ubuntu26-dbus-sandbox\|20261102-v1/);
 assert.ok(skill.includes('https://github.com/openai/codex-action/issues/188'));
 assert.match(skill,/ubuntu-24\.04/);
 assert.match(skill,/no.*extra executor/i);
});
