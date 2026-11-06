import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const script = String.raw`
import importlib.util, json
p = 'tools/site-shell/publish_powerhouse_blog_artifact.py'
s = importlib.util.spec_from_file_location('publisher', p)
m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
NL = chr(10)
def doc(*blocks): return {'title': 'Voorbereiden op boekhoud koppelingen', 'focus_keyword': 'boekhoud koppelingen', 'body': (NL + NL).join(blocks)}
def lines(*parts): return NL.join(parts)
def verdict(markup):
    try:
        m.assert_rendered_body_clean(markup); return 'PASS'
    except SystemExit as e:
        return str(e)
out = {}
out['heading_list'] = m.body_html(doc('Intro.', lines('## Meetpunten', '- een', '- twee')))
out['mixed'] = m.body_html(doc('Intro.', lines('2) Snelcontrole', '- Vraag: welke import?', '- Vraag: welke velden?', 'Eindresultaat: kies de eenvoudigste route.')))
out['heading_text'] = m.body_html(doc('Intro.', lines('## Signaal', 'Hier staat de uitleg.')))
out['h3_list'] = m.body_html(doc('Intro.', lines('### Subkop', '- a', '- b')))
out['correct_h2'] = m.body_html(doc('Intro.', '## Een kop', 'Alinea.'))
out['ul_only'] = m.body_html(doc('Intro.', lines('- een', '- twee')))
out['bold_ul'] = m.body_html(doc('Intro.', lines('**Let op:**', '- een', '- twee')))
leak_p = '<p>' + lines('2) Snelcontrole', '- Vraag: welke import?') + '</p>'
leak_h = '<h2>' + lines('Meetpunten', '- een', '- twee') + '</h2>'
long_h = '<h2>' + ('woord ' * 40) + '</h2>'
out['verdicts'] = {'clean': verdict(out['mixed']), 'leak_p': verdict(leak_p), 'leak_h': verdict(leak_h), 'long_h': verdict(long_h)}
print(json.dumps(out, ensure_ascii=False))
`;
const proc = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
assert.equal(proc.status, 0, proc.stderr || proc.stdout);
const out = JSON.parse(proc.stdout);
const listItems = html => [...html.matchAll(/<li>(.*?)<\/li>/g)].map(match => match[1]);

test('a heading is only its first line; a list under it becomes a real list', () => {
  assert.match(out.heading_list, /<h2>Meetpunten<\/h2>/);
  assert.deepEqual(listItems(out.heading_list), ['een', 'twee']);
  assert.doesNotMatch(out.heading_list, /<h2>[^<]*- /);
  assert.match(out.h3_list, /<h3>Subkop<\/h3>/);
  assert.deepEqual(listItems(out.h3_list), ['a', 'b']);
});

test('text and list lines in one block become separate paragraph and list elements', () => {
  assert.match(out.mixed, /<p>2\) Snelcontrole<\/p>/);
  assert.deepEqual(listItems(out.mixed), ['Vraag: welke import?', 'Vraag: welke velden?']);
  assert.match(out.mixed, /<p>Eindresultaat: kies de eenvoudigste route\.<\/p>/);
  assert.doesNotMatch(out.mixed, /<p>[^<]*- Vraag/);
});

test('text under a heading becomes its own paragraph instead of part of the heading', () => {
  assert.match(out.heading_text, /<h2>Signaal<\/h2>/);
  assert.match(out.heading_text, /<p>Hier staat de uitleg\.<\/p>/);
});

test('shapes that already rendered correctly are unchanged', () => {
  assert.match(out.correct_h2, /<h2>Een kop<\/h2>\s*<p>Alinea\.<\/p>/);
  assert.deepEqual(listItems(out.ul_only), ['een', 'twee']);
  assert.match(out.bold_ul, /<p><strong>Let op:<\/strong><\/p>\s*<ul><li>een<\/li><li>twee<\/li><\/ul>/);
});

test('the publisher blocks markdown lists and section-sized headings in rendered markup', () => {
  assert.equal(out.verdicts.clean, 'PASS');
  assert.equal(out.verdicts.leak_p, 'BLOG_ARTIFACT_NOT_READER_READY:MARKDOWN_LIST_IN_P');
  assert.equal(out.verdicts.leak_h, 'BLOG_ARTIFACT_NOT_READER_READY:MARKDOWN_LIST_IN_H2');
  assert.equal(out.verdicts.long_h, 'BLOG_ARTIFACT_NOT_READER_READY:HEADING_TOO_LONG');
  const publisher = readFileSync('tools/site-shell/publish_powerhouse_blog_artifact.py', 'utf8');
  assert.match(publisher, /assert_rendered_body_clean\(body_markup\)/);
});
