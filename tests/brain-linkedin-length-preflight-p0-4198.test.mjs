import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const orchestrator=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const publisher=read('supabase/functions/powerhouse-social-publisher/index.ts');

test('both LinkedIn channels compact before hashing, gate review and content artifact persist',()=>{
  const compact=orchestrator.indexOf("bodyText = compactLinkedInCommentary(bodyText)");
  const personal=orchestrator.indexOf("personalFinalCopyValid(bodyText");
  const hash=orchestrator.indexOf("const finalTextHash = await digest(bodyText)");
  const persist=orchestrator.indexOf("stage = 'write-artifact'");
  assert.ok(compact>0 && compact<personal && personal<hash && hash<persist);
  assert.match(orchestrator,/function compactLinkedInCommentary\(value:string,maxLength=2800\)/);
  assert.match(orchestrator,/split\(\/\\n\\s\*\\n\/\)/);
});
test('publisher refuses LinkedIn payload over provider limit before publication claims',()=>{
  const guard=publisher.indexOf("error:'LINKEDIN_COMMENTARY_LIMIT_EXCEEDED'");
  const claim=publisher.indexOf("state: 'dispatching'");
  const capability=publisher.indexOf("capability=await issuePublishCapability");
  const create=publisher.indexOf("'LINKEDIN_CREATE_LINKED_IN_POST'");
  assert.ok(guard>0 && claim>guard && capability>claim && create>0);
  assert.match(publisher,/Array\.from\(clean\(art\.body\)\)\.length > 3000/);
  assert.match(publisher,/possible_provider_side_effect:false,republish_forbidden:false/);
});
test('existing provider identity, review, uniqueness and authority remain in place',()=>{
  for(const token of ['PRE_PUBLISH_GATE_BLOCKED','reserveGlobalUniquePublication','consumePublishCapability','LINKEDIN_COMPANY_FRESH_ORG_OAUTH_REQUIRED','LINKEDIN_PERSONAL_PROVIDER_CREATE_NOT_PROVEN'])assert.ok(publisher.includes(token),token);
});
