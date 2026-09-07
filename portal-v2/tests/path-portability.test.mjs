import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const here=new URL('../',import.meta.url);

test('portal-v2 shell uses path-portable local assets',async()=>{
  const html=await readFile(new URL('index.html',here),'utf8');
  const js=await readFile(new URL('app.js',here),'utf8');
  assert.match(html,/href="\.\/app\.css"/);
  assert.match(html,/src="\.\/app\.js"/);
  assert.doesNotMatch(html,/\/portal-v2\/app\.(css|js)/);
  assert.match(js,/setAttribute\('src','\.\/brain\.svg'\)/);
  assert.doesNotMatch(js,/setAttribute\('src','\/portal-v2\/brain\.svg'\)/);
});
