import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const schema=JSON.parse(fs.readFileSync('tools/content-growth/events-schema.json','utf8'));
test('schema supports blog linkedin social and order revenue',()=>{
  assert.deepEqual(schema.properties.content_type.enum,['blog','linkedin','social']);
  for (const x of ['order','revenue','qualified_lead','click','engagement']) assert.ok(schema.properties.event_type.enum.includes(x));
});
