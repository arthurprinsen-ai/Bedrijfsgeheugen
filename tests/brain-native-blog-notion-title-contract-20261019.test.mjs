import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Notion live data source 70706495-cc0c-44ed-84bc-493df00651f1:
// "Titel" is a TITLE property; creating pages with rich_text returns HTTP 400.
const workflow = readFileSync(new URL('../.github/workflows/native-approved-blog-supply.yml', import.meta.url), 'utf8');

test('native approved blog uses the Notion title property, never rich_text, for Titel', () => {
  assert.match(workflow, /'Titel':\{'title':rich\(title\)\}/);
  assert.doesNotMatch(workflow, /'Titel':\{'rich_text':/);
});

test('native approved blog still enforces approval and one-date stock protection', () => {
  assert.match(workflow, /Check whether central Approved Blogtekst stock already covers this date/);
  assert.match(workflow, /'Autopublish toegestaan':\{'checkbox':True\}/);
  assert.match(workflow, /'Quality gate':\{'select':\{'name':'Geslaagd'\}\}/);
  assert.match(workflow, /'Herzien':\{'select':\{'name':'Goedgekeurd'\}\}/);
});
