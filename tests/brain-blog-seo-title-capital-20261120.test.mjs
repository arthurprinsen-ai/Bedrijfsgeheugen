import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// seo_title built "<lowercase focus>: <suffix>" and published it as-is
// ("boekhouding klaarmaakt: wat verandert er voor jou?"). A title must start
// with a capital whatever shape the focus keyword has.
const script = String.raw`
import importlib.util, json
p = 'tools/site-shell/publish_powerhouse_blog_artifact.py'
s = importlib.util.spec_from_file_location('publisher', p)
m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
long_title = 'Hoe je jouw boekhouding klaarmaakt voor mobiele betaalkoppelingen: praktisch stappenplan'
focus = m.seo_focus({'title': long_title, 'body': long_title, 'focus_keyword': ''})
print(json.dumps({
  'suffix': m.seo_title(long_title, focus),
  'prefix': m.seo_title('Voorbereiden op koppelingen', 'boekhoud koppelingen'),
  'short': m.seo_title('Boekhouding klaarmaken', 'Boekhouding'),
}))
`;
const run = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr);
const titles = JSON.parse(run.stdout);

test('a generated seo title never starts lowercase', () => {
  for (const [key, value] of Object.entries(titles)) {
    assert.ok(!/^[a-zà-ÿ]/.test(value), `${key}: ${value}`);
    assert.ok(value.length <= 60, `${key} too long: ${value}`);
  }
});
