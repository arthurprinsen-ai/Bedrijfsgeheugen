import test from 'node:test';
import assert from 'node:assert/strict';
import {askPortal} from '../ask-portal.js';

test('portal question sends only the question as tenant-safe server input and returns assurance', async()=>{
  let body=null;
  const answer=await askPortal('Wat vraagt aandacht?',{fetchImpl:async(_url,options)=>{ body=JSON.parse(options.body); return {ok:true,json:async()=>({antwoord:'Kijk naar marge.',assurance:{status:'grounded',source:'serverstate'}})}; }});
  assert.deepEqual(body,{vraag:'Wat vraagt aandacht?'});
  assert.equal(answer.text,'Kijk naar marge.');
  assert.equal(answer.assurance.status,'grounded');
});