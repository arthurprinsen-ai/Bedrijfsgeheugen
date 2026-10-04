import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { DESKTOP_NAV_GROUPS } from '../navigation-model.js';

const here=dirname(fileURLToPath(import.meta.url));
const index=readFileSync(resolve(here,'../index.html'),'utf8');
const shell=readFileSync(resolve(here,'../page-shell.js'),'utf8');
const app=readFileSync(resolve(here,'../app.js'),'utf8');

test('Koppelingen is expliciet bereikbaar vanuit de ene Portal V2 navigatie',()=>{
  const koppelingen=DESKTOP_NAV_GROUPS.flatMap(group=>group.pages).find(page=>page.target==='koppelingen');
  assert.equal(koppelingen?.label,'Koppelingen');
  assert.match(shell,/pageId==='koppelingen'/);
  assert.match(index,/data-open-page="koppelingen"><i>∞<\/i>Koppelingen beheren/);
  assert.match(index,/data-open-page="koppelingen"><i>⌘<\/i>Koppeling bouwen/);
  assert.match(app,/dataset\.navTarget=page\.target/);
  assert.match(app,/navigatePortal\(control\.dataset\.openPage\)/);
});
