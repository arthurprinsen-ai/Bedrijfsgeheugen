import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Wet DBA blog has a complete versioned static English cache shard',()=>{
  const shard=JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/2026-10-03-wet-dba-blog.json','utf8'));
  assert.equal(Object.keys(shard).length,66);
  assert.equal(shard['Wet DBA en zelfstandigen: wat verandert er en wat betekent dat voor jou?'],'Wet DBA and self-employed professionals: what is changing and what does it mean for you?');
  assert.ok(shard['Handhaving is al begonnen']);
  assert.ok(shard['Wil je weten of jouw huidige opdrachtsituatie standhouden bij een beoordeling? Kijk welke tools en inzichten beschikbaar zijn via het menu, of neem contact op voor een gesprek.']);
});
