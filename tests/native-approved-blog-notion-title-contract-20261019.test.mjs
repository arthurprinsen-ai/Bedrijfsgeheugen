import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/native-approved-blog-supply.yml',import.meta.url),'utf8');

test('Approved blog Notion payload maps the database title property to title',()=>{
  assert.match(workflow, /'Titel':\s*\{'title':rich\(title\)\}/);
  assert.doesNotMatch(workflow, /'Titel':\s*\{'rich_text'/);
});

test('Approved blog Notion payload retains text, date and governance types',()=>{
  assert.match(workflow, /'Approved Blogtekst':\s*\{'rich_text':rich\(blogtext\)\}/);
  assert.match(workflow, /'Publicatiedatum':\s*\{'date':\{'start':date\}\}/);
  assert.match(workflow, /'Autopublish toegestaan':\s*\{'checkbox':True\}/);
  assert.match(workflow, /'Quality gate':\s*\{'select':\{'name':'Geslaagd'\}\}/);
  assert.match(workflow, /if verification:/);
  assert.match(workflow, /NATIVE_APPROVED_BLOG_VERIFICATION_OK/);
});
