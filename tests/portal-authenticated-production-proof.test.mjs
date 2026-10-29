import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  PORTAL_AUTH_PROOF_CONTRACT,
  decodeJwtPayload,
  portalAuthProofKey,
  runPortalAuthenticatedProductionProof,
} from '../platform/api/portal-authenticated-production-proof-core.mjs';

const commit='a'.repeat(40);
const deploy={
  id:'deploy-123',
  commitRef:commit,
  context:'production',
  permalinkUrl:'https://deploy-123--bedrijfsgeheugen.netlify.app',
};
const jwt=payload=>[
  Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),
  Buffer.from(JSON.stringify(payload)).toString('base64url'),
  'signature',
].join('.');

test('production proof authenticates two distinct tenants on the immutable deploy and cleans up both',async()=>{
  const seen={created:[],deleted:[],requests:[]};
  const tokens={
    a:jwt({sub:'proof-user-a',app_metadata:{tenantId:'proof:deploy-123:a'}}),
    b:jwt({sub:'proof-user-b',app_metadata:{tenantId:'proof:deploy-123:b'}}),
  };
  const identityAdmin={
    createUser:async input=>{
      seen.created.push(input);
      const slot=input.email.includes('-a-')?'a':'b';
      return {id:`proof-user-${slot}`};
    },
    getUser:async id=>({id,appMetadata:seen.created.find(x=>x.email.includes(id.endsWith('-a')?'-a-':'-b-')).data.app_metadata}),
    updateUser:async()=>{throw new Error('UNEXPECTED_USER_UPDATE')},
    deleteUser:async id=>seen.deleted.push(id),
  };
  const fetchImpl=async(url,options)=>{
    seen.requests.push({url,options});
    if(url.endsWith('/token')){
      const slot=new URLSearchParams(options.body).get('username').includes('-a-')?'a':'b';
      return {ok:true,status:200,json:async()=>({access_token:tokens[slot]})};
    }
    const slot=options.headers.authorization===`Bearer ${tokens.a}`?'a':'b';
    return {ok:true,status:200,json:async()=>({
      sources:[],publications:[],signals:[],
      intelligence:{tenantId:`proof:deploy-123:${slot}`},
      scope:{authenticatedTenant:`proof:deploy-123:${slot}`},
      stats:{generatedAt:'2026-10-07T20:00:00.000Z'},
    })};
  };
  const proof=await runPortalAuthenticatedProductionProof({
    deploy,identityAdmin,fetchImpl,
    getIdentityConfigFn:()=>({url:'https://bedrijfsgeheugen.netlify.app/.netlify/identity'}),
    randomPassword:()=> 'x'.repeat(40),
    now:()=> '2026-10-07T20:00:01.000Z',
  });
  assert.equal(proof.contract,PORTAL_AUTH_PROOF_CONTRACT);
  assert.equal(proof.status,'PROVEN');
  assert.equal(proof.http_status,200);
  assert.equal(proof.tenant_count_verified,2);
  assert.equal(proof.tenant_scope_verified,true);
  assert.equal(proof.cross_tenant_scope_verified,true);
  assert.equal(proof.payload_shape_verified,true);
  assert.equal(proof.synthetic_user_cleanup,'DELETED');
  assert.equal(proof.failure_code,null);
  assert.deepEqual(seen.created.map(u=>u.data.app_metadata.tenantId),['proof:deploy-123:a','proof:deploy-123:b']);
  assert.deepEqual(seen.deleted,['proof-user-b','proof-user-a']);
  assert.equal(seen.requests.filter(r=>r.url.endsWith('/api/portal-ondernemersdata')).length,2);
  assert.equal(JSON.stringify(proof).includes('proof-user'),false);
  assert.equal(JSON.stringify(proof).includes('@proof.invalid'),false);
});

test('failed authenticated HTTP proof fails closed but still deletes the synthetic user',async()=>{
  const deleted=[];
  const token=jwt({sub:'proof-user',app_metadata:{tenantId:'proof:deploy-123:a'}});
  let calls=0;
  const proof=await runPortalAuthenticatedProductionProof({
    deploy,
    identityAdmin:{
      createUser:async()=>({id:'proof-user'}),
      getUser:async()=>({appMetadata:{tenantId:'proof:deploy-123:a'}}),
      updateUser:async()=>{throw new Error('UNEXPECTED_USER_UPDATE')},
      deleteUser:async id=>deleted.push(id),
    },
    getIdentityConfigFn:()=>({url:'https://bedrijfsgeheugen.netlify.app/.netlify/identity'}),
    fetchImpl:async()=>{
      calls+=1;
      if(calls===1)return {ok:true,status:200,json:async()=>({access_token:token})};
      return {ok:false,status:401,json:async()=>({error:'UNAUTHENTICATED'})};
    },
    randomPassword:()=> 'x'.repeat(40),
  });
  assert.equal(proof.status,'FAILED');
  assert.equal(proof.http_status,401);
  assert.equal(proof.failure_code,'AUTHENTICATED_PORTAL_API_HTTP_401');
  assert.equal(proof.synthetic_user_cleanup,'DELETED');
  assert.deepEqual(deleted,['proof-user']);
});

test('cleanup failure can never leave a green production proof',async()=>{
  const token=jwt({sub:'proof-user',app_metadata:{tenantId:'proof:deploy-123:a'}});
  let calls=0;
  const proof=await runPortalAuthenticatedProductionProof({
    deploy,
    identityAdmin:{
      createUser:async()=>({id:'proof-user'}),
      getUser:async()=>({appMetadata:{tenantId:'proof:deploy-123:a'}}),
      updateUser:async()=>{throw new Error('UNEXPECTED_USER_UPDATE')},
      deleteUser:async()=>{throw new Error('delete failed')},
    },
    getIdentityConfigFn:()=>({url:'https://bedrijfsgeheugen.netlify.app/.netlify/identity'}),
    fetchImpl:async()=>{
      calls+=1;
      if(calls===1)return {ok:true,status:200,json:async()=>({access_token:token})};
      return {ok:true,status:200,json:async()=>({
        sources:[],publications:[],signals:[],intelligence:{},
        scope:{authenticatedTenant:'proof:deploy-123:a'},
        stats:{generatedAt:'2026-10-07T20:00:00.000Z'},
      })};
    },
    randomPassword:()=> 'x'.repeat(40),
  });
  assert.equal(proof.status,'FAILED');
  assert.equal(proof.failure_code,'SYNTHETIC_USER_CLEANUP_FAILED');
  assert.equal(proof.synthetic_user_cleanup,'FAILED');
});

test('proof key and JWT decoding are deterministic and fail closed',()=>{
  assert.equal(portalAuthProofKey(commit),`commits/${commit}.json`);
  assert.equal(decodeJwtPayload(jwt({sub:'u'})).sub,'u');
  assert.throws(()=>portalAuthProofKey('main'),/INVALID_COMMIT_REF/);
});

test('Netlify wiring and production readback require exact commit/deploy authenticated proof',async()=>{
  const event=await readFile(new URL('../netlify/functions/portal-authenticated-production-proof.mjs',import.meta.url),'utf8');
  const reader=await readFile(new URL('../netlify/functions/portal-authenticated-production-proof-readback.mjs',import.meta.url),'utf8');
  const workflow=await readFile(new URL('../.github/workflows/production-release-readback.yml',import.meta.url),'utf8');
  const policy=JSON.parse(await readFile(new URL('../config/brain-delivery-system.json',import.meta.url),'utf8'));

  assert.match(event,/deploySucceeded/);
  assert.match(event,/deploy\?\.context!=='production'/);
  assert.match(event,/admin,getIdentityConfig/);
  assert.match(event,/setJSON\(portalAuthProofKey\(deploy\.commitRef\),proof\)/);
  assert.match(reader,/portal-authenticated-production-proof/);
  assert.match(reader,/consistency:'strong'/);
  assert.match(workflow,/Verify authenticated Portal production API proof/);
  assert.match(workflow,/EXPECTED_DEPLOY_ID/);
  assert.match(workflow,/tenant_scope_verified/);
  assert.match(workflow,/synthetic_user_cleanup/);
  const portalLane=policy.lanes.find(lane=>lane.id==='portal');
  assert.ok(portalLane.paths.includes('netlify/functions/portal-'),'all portal-* functions must stay in the protected portal lane');
});


test('protected Portal ondernemersdata keeps privileged Supabase access behind the existing EU Edge authority',async()=>{
  const source=await readFile(new URL('../netlify/functions/portal-ondernemersdata.mjs',import.meta.url),'utf8');
  const store=await readFile(new URL('../netlify/functions/_portal-supabase-store.mjs',import.meta.url),'utf8');
  const edge=await readFile(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
  assert.match(source,/createSupabasePortalProjectionStore/);
  assert.match(source,/getEntrepreneurIntelligence\(tenantId\)/);
  assert.doesNotMatch(source,/SUPABASE_(?:SERVICE_ROLE_KEY|SERVICE_KEY|SECRET_KEY)/);
  assert.doesNotMatch(source,/\/rest\/v1\//);
  assert.doesNotMatch(source,/Netlify\.env/);
  assert.match(store,/BG_PORTAL_EU_SUPABASE_URL/);
  assert.match(store,/BG_PORTAL_EU_SERVICE_TOKEN/);
  assert.match(store,/action:'entrepreneur_intelligence'/);
  assert.match(edge,/if\(action==='entrepreneur_intelligence'\)/);
  assert.match(edge,/Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/);
});

test('wrong-tenant JWT fails closed before any portal payload is returned',async()=>{
  const deleted=[];
  const token=jwt({sub:'proof-user',app_metadata:{tenantId:'other-tenant'}});
  const proof=await runPortalAuthenticatedProductionProof({
    deploy,
    identityAdmin:{createUser:async()=>({id:'proof-user'}),getUser:async()=>({appMetadata:{tenantId:'proof:deploy-123:a'}}),updateUser:async()=>{throw new Error('UNEXPECTED_USER_UPDATE')},deleteUser:async id=>deleted.push(id)},
    getIdentityConfigFn:()=>({url:'https://bedrijfsgeheugen.netlify.app/.netlify/identity'}),
    fetchImpl:async()=>({ok:true,status:200,json:async()=>({access_token:token})}),
    randomPassword:()=> 'x'.repeat(40),
  });
  assert.equal(proof.status,'FAILED');
  assert.equal(proof.failure_code,'IDENTITY_TENANT_CLAIM_MISMATCH');
  assert.equal(proof.tenant_count_verified,0);
  assert.equal(proof.cross_tenant_scope_verified,false);
  assert.deepEqual(deleted,['proof-user']);
});

test('production proof repairs admin-owned metadata before requesting signed JWTs for two synthetic tenants',async()=>{
  const users=new Map(),updates=[],deleted=[];
  const admin={
    createUser:async input=>{
      const slot=input.email.includes('-a-')?'a':'b';
      const id='synthetic-'+slot;
      users.set(id,{id,appMetadata:{provider:'email'}});
      return {id};
    },
    getUser:async id=>users.get(id),
    updateUser:async(id,attrs)=>{
      updates.push({id,attrs});
      const u=users.get(id);
      users.set(id,{...u,appMetadata:attrs.app_metadata});
      return users.get(id);
    },
    deleteUser:async id=>{deleted.push(id);users.delete(id)},
  };
  const fetchImpl=async(url,options)=>{
    if(url.endsWith('/token')){
      const username=new URLSearchParams(options.body).get('username');
      const slot=username.includes('-a-')?'a':'b',user=users.get('synthetic-'+slot);
      return {ok:true,status:200,json:async()=>({
        access_token:jwt({sub:user.id,app_metadata:user.appMetadata}),
      })};
    }
    const claims=decodeJwtPayload(options.headers.authorization.replace(/^Bearer /,''));
    return {ok:true,status:200,json:async()=>({
      sources:[],publications:[],signals:[],intelligence:{},
      scope:{authenticatedTenant:claims.app_metadata.tenantId},
      stats:{generatedAt:'2026-10-29T16:15:00Z'},
    })};
  };
  const proof=await runPortalAuthenticatedProductionProof({
    deploy,identityAdmin:admin,fetchImpl,
    getIdentityConfigFn:()=>({url:'https://bedrijfsgeheugen.netlify.app/.netlify/identity'}),
    randomPassword:()=> 'x'.repeat(40),
  });
  assert.equal(proof.status,'PROVEN');
  assert.equal(proof.tenant_count_verified,2);
  assert.equal(proof.cross_tenant_scope_verified,true);
  assert.equal(proof.synthetic_user_cleanup,'DELETED');
  assert.deepEqual(updates.map(x=>x.attrs.app_metadata.tenantId),
    ['proof:deploy-123:a','proof:deploy-123:b']);
  assert.deepEqual(deleted,['synthetic-b','synthetic-a']);
  assert.equal(users.size,0);
});

test('admin metadata not persisted fails closed without attempting a bearer token or portal request',async()=>{
  const deleted=[];
  let fetchCount=0;
  const proof=await runPortalAuthenticatedProductionProof({
    deploy,
    identityAdmin:{
      createUser:async()=>({id:'synthetic-a'}),
      getUser:async()=>({appMetadata:{provider:'email'}}),
      updateUser:async()=>({}),
      deleteUser:async id=>deleted.push(id),
    },
    getIdentityConfigFn:()=>({url:'https://bedrijfsgeheugen.netlify.app/.netlify/identity'}),
    fetchImpl:async()=>{fetchCount++;throw new Error('UNEXPECTED_NETWORK_CALL')},
    randomPassword:()=> 'x'.repeat(40),
  });
  assert.equal(proof.status,'FAILED');
  assert.equal(proof.failure_code,'IDENTITY_ADMIN_TENANT_METADATA_NOT_PERSISTED');
  assert.equal(proof.tenant_count_verified,0);
  assert.equal(proof.cross_tenant_scope_verified,false);
  assert.equal(proof.synthetic_user_cleanup,'DELETED');
  assert.equal(fetchCount,0);
  assert.deepEqual(deleted,['synthetic-a']);
});
