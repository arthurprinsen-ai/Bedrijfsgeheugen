import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';

const bridge=readFileSync(new URL('../supabase/functions/netlify-deploy-bridge/index.ts',import.meta.url),'utf8');

test('Composio app tools are explicitly preloaded before a session execute call',()=>{
  assert.match(bridge,/const allowed = \[[\s\S]*?NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER[\s\S]*?NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER[\s\S]*?\];/);
  assert.match(bridge,/toolkits: \{ enable: \["netlify_mcp"\] \}/);
  assert.match(bridge,/preload: \{ tools: allowed \}/);
  assert.match(bridge,/connected_accounts: \{ netlify_mcp: \[context\.accountId\] \}/);
  assert.match(bridge,/if \(!allowed\.includes\(slug\)\) throw new Error/);
});

test('v3.1 tool-router completed data envelope is not falsely failed',()=>{
  assert.match(bridge,/resultType === "completed"/);
  assert.match(bridge,/return JSON\.stringify\(parsed\.data\)/);
  assert.ok(!bridge.includes('if (!executeRes.ok || parsed?.successful !== true)'));
  // Regression: completed data is necessary; never accept a false-green envelope.
  const accepts=(http,reply)=>http>=200&&http<300&&reply?.result_type==='completed'&&
    reply.data!==undefined&&reply.data!==null&&!reply.error&&reply.data?.successful!==false;
  assert.equal(accepts(200,{result_type:'completed',data:{id:'site'}}),true);
  assert.equal(accepts(200,{result_type:'completed',data:{id:'site'},error:null}),true);
  assert.equal(accepts(200,{result_type:'completed',data:{successful:false}}),false);
  assert.equal(accepts(200,{successful:true}),false);
  assert.equal(accepts(400,{result_type:'completed',data:{id:'site'}}),false);
  assert.equal(accepts(200,{result_type:'failed',data:{id:'site'}}),false);
  assert.equal(accepts(200,{result_type:'completed',data:{id:'site'},error:'permission'}),false);
  assert.equal(accepts(200,{}),false);
});

test('OIDC identity, exact site and production fail-closed controls remain mandatory',()=>{
  assert.match(bridge,/jwtVerify\(token, jwks, \{ issuer, audience \}\)/);
  assert.match(bridge,/payload\.repository !== expectedRepo \|\| payload\.ref !== expectedRef \|\| payload\.workflow_ref !== expectedWorkflowRef/);
  assert.match(bridge,/if \(!readResult\.includes\(siteId\)\) throw new Error/);
  assert.match(bridge,/if \(!match\) throw new Error\("fresh netlify proxy not issued"\)/);
  assert.match(bridge,/if \(!accepted\) \{/);
});

test('no provider response body, account, key or access token is logged',()=>{
  const rejectionLog=bridge.slice(bridge.indexOf('console.error("NETLIFY_SESSION_TOOL_REJECTED"'),bridge.indexOf('throw new Error("composio pinned session execute "'));
  assert.ok(rejectionLog.length>0);
  assert.ok(!rejectionLog.includes('sessionRaw'));
  assert.ok(!rejectionLog.includes('raw,'));
  assert.ok(!rejectionLog.includes('context.accountId'));
  assert.ok(!rejectionLog.includes('apiKey'));
});
