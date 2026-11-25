import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

// seo_focus took the first two words after a question opener, so "Hoe je Twinfield-koppeling ..."
// became the focus keyword "je Twinfield", and seo_title turned it into the published title
// "je Twinfield: wat verandert er voor jou?" (same for "jouw MKB"). A pronoun is not a topic.
const script = String.raw`
import importlib.util, json
p = 'tools/site-shell/publish_powerhouse_blog_artifact.py'
s = importlib.util.spec_from_file_location('publisher', p)
m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
def focus(title, body, raw=''): return m.seo_focus({'title': title, 'body': body, 'focus_keyword': raw})
out = {
  'je': focus('Hoe je Twinfield-koppeling voorbereidt voor mobiele betalingen: praktisch stappenplan', 'Twinfield mobiele betalingen'),
  'jouw': focus('Hoe jouw MKB zich praktisch voorbereidt op de verwachte Twinfield open API', 'MKB Twinfield open API'),
  'raw_pronoun': focus('Hoe je Twinfield-koppeling voorbereidt', 'Twinfield mobiele betalingen', 'je Twinfield'),
  'normal': focus('Voorbereiden op boekhoud koppelingen', 'boekhoud koppelingen', 'boekhoud koppelingen'),
}
print(json.dumps(out))
`;
const run = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr);
const focus = JSON.parse(run.stdout);

test('a pronoun after a question opener is never the focus keyword', () => {
  for (const key of ['je', 'jouw', 'raw_pronoun']) {
    assert.ok(!/(^|\s)(je|jij|jouw|jullie|u|uw|zich|mijn|ons|onze|we|wij)(\s|$)/i.test(focus[key]), `${key}: ${focus[key]}`);
  }
  assert.equal(focus.je, 'Twinfield');
});

test('a normal explicit focus keyword is kept', () => {
  assert.equal(focus.normal, 'boekhoud koppelingen');
});

test('no published article has a lowercase title or a pronoun as zoekwoord', () => {
  const dirs = readdirSync('blog', { withFileTypes: true }).filter(entry => entry.isDirectory());
  let checked = 0;
  for (const dir of dirs) {
    const file = `blog/${dir.name}/index.html`;
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    const title = (html.match(/<title>(.*?)<\/title>/s) || [])[1];
    const keyword = (html.match(/name="bg-zoekwoord" content="([^"]*)"/) || [])[1];
    if (!title) continue;
    checked += 1;
    assert.ok(!/^[a-zà-ÿ]/.test(title), `${dir.name}: title starts lowercase: ${title}`);
    if (keyword) assert.ok(!/^(je|jij|jouw|jullie|u|uw|zich|mijn|ons|onze|we|wij)\s/i.test(keyword), `${dir.name}: pronoun keyword: ${keyword}`);
  }
  assert.ok(checked > 0, 'no article checked');
});
