import test from 'node:test';
import assert from 'node:assert/strict';
import {runSocialPublicationDelivery,default as handler} from '../netlify/functions/social-publication-delivery.mjs';
test('retired compatibility sender leaves delivery with canonical publisher',async()=>{
 assert.deepEqual(await runSocialPublicationDelivery(),{ok:false,contract:'LEGACY_BUFFER_SOCIAL_WRITER_RETIRED_V1',reason:'RETIRED_DUPLICATE_BUFFER_SENDER',canonical_executor:'supabase:powerhouse-social-publisher',provider_write_performed:false,delivery_claimed:false});
});
test('retired compatibility endpoint fails closed without a provider request',async()=>{
 const original=globalThis.fetch;let requests=0;globalThis.fetch=async()=>{requests++;throw Error('provider unavailable');};
 try{const response=await handler();assert.equal(response.status,410);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal((await response.json()).provider_write_performed,false);assert.equal(requests,0);}finally{globalThis.fetch=original;}
});
