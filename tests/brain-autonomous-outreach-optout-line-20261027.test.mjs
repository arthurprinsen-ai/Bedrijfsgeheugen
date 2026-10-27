import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../supabase/functions/powerhouse-autonomous-outreach/index.ts',import.meta.url),'utf8');
test('every autonomous mail gets the opt-out line that the reply loop understands',()=>{
 assert.match(src,/function withOptOutLine\(/);
 assert.match(src,/send\(key,acct,to,sub,withOptOutLine\(body\)\)/);
 assert.doesNotMatch(src,/send\(key,acct,to,sub,body\)/);
 const reply=readFileSync(new URL('../supabase/functions/powerhouse-email-reply-loop/index.ts',import.meta.url),'utf8');
 assert.match(reply,/' afmelden'/);
});
test('recipient authority and suppression gates are untouched',()=>{
 assert.match(src,/RECIPIENT_AUTHORITY_UNVERIFIED/);
 assert.match(src,/powerhouse_email_contact_suppressions/);
 assert.match(src,/human_approved!==true/);
});
