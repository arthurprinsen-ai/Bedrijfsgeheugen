import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
test('OpenAI json_object requests contain the word JSON in the input messages',()=>{
 const m=src.match(/input:([^\n]*?),text:\{format:\{type:'json_object'\}\}/);
 assert.ok(m,'json_object request not found');
 assert.match(m[1],/JSON/);
});
