import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const index=readFileSync(resolve(here,'../index.html'),'utf8');
const shell=readFileSync(resolve(here,'../page-shell.js'),'utf8');
const app=readFileSync(resolve(here,'../app.js'),'utf8');

test('Koppelingen is expliciet bereikbaar vanuit de Portal V2 shell',()=>{
  assert.match(shell,/data-pv-global-page="koppelingen">Koppelingen</);
  assert.match(index,/data-open-page="koppelingen"><i>∞<\/i>Koppelingen beheren/);
  assert.match(index,/data-open-page="koppelingen"><i>⌘<\/i>Koppeling bouwen/);
  assert.match(app,/querySelectorAll\('\[data-open-page\]'\)/);
  assert.match(app,/navigatePortal\(control\.dataset\.openPage\)/);
});
