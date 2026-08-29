import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('header click interaction keeps explicit open/close state and hidden mobile panels', async () => {
  const [js, css] = await Promise.all([
    readFile('components/header/header.js', 'utf8'),
    readFile('components/header/header.css', 'utf8')
  ]);

  assert.match(js, /var desktopTrigs = kop\.querySelectorAll\('\.bgkop-trig'\)/);
  assert.match(js, /t\.getAttribute\('aria-expanded'\) === 'true'/);
  assert.match(js, /sluitDesktop\(\)/);
  assert.match(js, /if \(!wasOpen\) t\.setAttribute\('aria-expanded', 'true'\)/);
  assert.match(js, /e\.key === 'Escape'/);
  assert.match(css, /\.bgkop-trig\[aria-expanded="false"\] \+ \.bgkop-paneel/);
  assert.match(css, /\.bgkop-trig\[aria-expanded="true"\] \+ \.bgkop-paneel/);
  assert.match(css, /\.bgkop-mpaneel\[hidden\]\{display:none\}/);
});
