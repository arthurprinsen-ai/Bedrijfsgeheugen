import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// powerhouse-composio-linkedin-setup assigns resume_attempted, publisher_http, publisher_ok and
// publisher_results on its result object after the literal was created. Without an explicit
// Record type, `deno check` rejects these assignments (TS2339). This guards the annotation.
const src=readFileSync(new URL('../supabase/functions/powerhouse-composio-linkedin-setup/index.ts',import.meta.url),'utf8');

test('the setup result object accepts the publisher-resume fields',()=>{
  assert.match(src,/const result:Record<string,any>=\{/);
  assert.match(src,/result\.resume_attempted=true;/);
  assert.match(src,/result\.publisher_ok=/);
});
