import test from 'node:test';
import assert from 'node:assert/strict';
import { entrepreneurAuthHeaders, loadEntrepreneurData } from '../modules/entrepreneur-intelligence.js';

test('external intelligence sends the active Netlify Identity bearer token', async()=>{
  const identityProvider=async()=>({
    currentUser:()=>({jwt:async()=> 'portal-jwt'})
  });
  const headers=await entrepreneurAuthHeaders(identityProvider);
  assert.equal(headers.accept,'application/json');
  assert.equal(headers.authorization,'Bearer portal-jwt');

  let seen;
  const fetchImpl=async(url,options)=>{
    seen={url,options};
    return {ok:true,status:200,json:async()=>({sources:[],publications:[],signals:[]})};
  };
  await loadEntrepreneurData(fetchImpl,identityProvider);
  assert.equal(seen.url,'/api/portal-ondernemersdata');
  assert.equal(seen.options.credentials,'same-origin');
  assert.equal(seen.options.headers.authorization,'Bearer portal-jwt');
});

test('external intelligence does not expose raw API status codes to portal users', async()=>{
  const identityProvider=async()=>({
    currentUser:()=>({jwt:async()=> 'portal-jwt'})
  });
  const fetchImpl=async()=>({ok:false,status:401,json:async()=>({error:'UNAUTHENTICATED'})});
  await assert.rejects(
    ()=>loadEntrepreneurData(fetchImpl,identityProvider),
    /Je sessie is verlopen/
  );
});
