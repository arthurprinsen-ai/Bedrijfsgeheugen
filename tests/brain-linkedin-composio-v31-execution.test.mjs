import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('LinkedIn Composio v3.1 uses user_id and structured arguments', () => {
  assert.match(source,/function composioExecuteArgs/);
  assert.match(source,/user_id:userId,version:'latest',arguments:args/);
  assert.match(source,/composioExecuteArgs\(apiKey,accountId,userId,'LINKEDIN_GET_MY_INFO',\{\}\)/);
  assert.match(source,/LINKEDIN_CREATE_LINKED_IN_POST',\{author,commentary,visibility:'PUBLIC',lifecycleState:'PUBLISHED'\}/);
});

test('LinkedIn direct path does not use natural-language text execution', () => {
  assert.doesNotMatch(source,/LINKEDIN_GET_MY_INFO','Return the authenticated LinkedIn member id/);
  assert.doesNotMatch(source,/Create a PUBLIC LinkedIn post with lifecycleState PUBLISHED/);
});
