import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalProjectStore} from '../netlify/functions/_portal-project-store.mjs';

const TENANT_ID='11111111-1111-4111-8111-111111111111';
const response=body=>({ok:true,status:200,json:async()=>body});

test('resolveTenant gebruikt uitsluitend een gebruikte uitnodiging voor de geauthenticeerde email',async()=>{
  let seenUrl='';
  const store=createPortalProjectStore({
    baseUrl:'https://example.supabase.co',serviceToken:'secret',
    fetchFn:async url=>{seenUrl=String(url);return response([{organisatie_id:TENANT_ID,gebruikt_op:'2026-09-07T10:00:00Z'}])}
  });
  assert.equal(await store.resolveTenant({email:' Arthur@Bedrijfsgeheugen.nl '}),TENANT_ID);
  assert.match(seenUrl,/uitnodigingen\?/);
  assert.match(seenUrl,/gebruikt_op=not\.is\.null/);
  assert.match(seenUrl,/email=ilike\.arthur%40bedrijfsgeheugen\.nl/);
});

test('resolveTenant blijft fail-closed bij meerdere organisaties op dezelfde email',async()=>{
  const store=createPortalProjectStore({
    baseUrl:'https://example.supabase.co',serviceToken:'secret',
    fetchFn:async()=>response([
      {organisatie_id:TENANT_ID,gebruikt_op:'2026-09-07T10:00:00Z'},
      {organisatie_id:'22222222-2222-4222-8222-222222222222',gebruikt_op:'2026-09-06T10:00:00Z'}
    ])
  });
  assert.equal(await store.resolveTenant({email:'arthur@bedrijfsgeheugen.nl'}),null);
});

test('resolveTenant doet geen databasecall zonder identity email',async()=>{
  let called=false;
  const store=createPortalProjectStore({baseUrl:'https://example.supabase.co',serviceToken:'secret',fetchFn:async()=>{called=true;return response([])}});
  assert.equal(await store.resolveTenant({id:'u1'}),null);
  assert.equal(called,false);
});
