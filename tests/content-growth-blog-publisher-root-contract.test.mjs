import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('Powerhouse blog publisher resolves repository-root assets after relocation', () => {
  const code = String.raw`
import pathlib, runpy
repo = pathlib.Path.cwd().resolve()
state = runpy.run_path('tools/site-shell/publish_powerhouse_blog_artifact.py', run_name='powerhouse_contract')
assert state['ROOT'].resolve() == repo, (state['ROOT'], repo)
for key in ['TEMPLATE', 'BLOG_INDEX', 'RSS', 'SITEMAP']:
    path = state[key]
    assert path.exists(), f"{key} missing: {path}"
print('POWERHOUSE_BLOG_PUBLISHER_ROOT_CONTRACT_OK')
`;
  const result = spawnSync('python3', ['-c', code], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /POWERHOUSE_BLOG_PUBLISHER_ROOT_CONTRACT_OK/);
});
