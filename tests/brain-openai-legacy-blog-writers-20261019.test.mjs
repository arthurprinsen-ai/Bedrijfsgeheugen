import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const week = fs.readFileSync('.github/workflows/weekblog.yml','utf8');
const update = fs.readFileSync('.github/workflows/blog-bijwerken.yml','utf8');

for (const [name,workflow] of [['weekblog',week],['blog-update',update]]) {
  test(name+' uses OpenAI Codex with restricted workspace and no Anthropic secret',()=>{
    assert.match(workflow,/uses: openai\/codex-action@v1/);
    assert.match(workflow,/openai-api-key:\s*\$\{\{ secrets\.OPENAI_API_KEY \}\}/);
    assert.match(workflow,/permission-profile: ":workspace"/);
    assert.match(workflow,/safety-strategy: drop-sudo/);
    assert.match(workflow,/allow-bots: true/);
    assert.doesNotMatch(workflow,/anthropics\/claude-code-action|ANTHROPIC_API_KEY|api\.anthropic\.com|claude_args:/);
    assert.match(workflow,/createWriterCandidate/);
    assert.match(workflow,/gh pr create/);
    assert.doesNotMatch(workflow,/git push [^\n]*HEAD:main/);
  });
}
test('weekblog preflight checks OpenAI authorization without an extra paid provider call',()=>{
  assert.match(week,/if \[ -z "\$OPENAI_API_KEY" \]/);
  assert.doesNotMatch(week,/max_tokens":16|https:\/\/api\.anthropic\.com/);
});
