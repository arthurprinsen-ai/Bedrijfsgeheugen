import test from 'node:test';
import assert from 'node:assert/strict';
import { entrepreneurAuthHeaders, loadEntrepreneurData } from '../portal-v2/modules/entrepreneur-intelligence.js';

test('protected external-intelligence reads reuse the active portal identity bearer', async()=>{
  const identityProvider=async()=>({currentUser:()=>({jwt:async()=> 'portal-jwt'})});
  const headers=await entrepreneurAuthHeaders(identityProvider);
  assert.equal(headers.authorization,'Bearer portal-jwt');

  let seen;
  const fetchImpl=async(url,options)=>{
    seen={url,options};
    return {ok:true,status:200,json:async()=>({sources:[],publications:[],signals:[]})};
  };
  await loadEntrepreneurData(fetchImpl,identityProvider);
  assert.equal(seen.url,'/api/portal-ondernemersdata');
  assert.equal(seen.options.headers.authorization,'Bearer portal-jwt');
});

test('protected external-intelligence reads never expose raw 401 API text', async()=>{
  const identityProvider=async()=>({currentUser:()=>({jwt:async()=> 'portal-jwt'})});
  const fetchImpl=async()=>({ok:false,status:401,json:async()=>({error:'UNAUTHENTICATED'})});
  await assert.rejects(()=>loadEntrepreneurData(fetchImpl,identityProvider),/Je sessie is verlopen/);
});
