import test from 'node:test';
import assert from 'node:assert/strict';
const module = await import('../supabase/functions/_shared/mira-openai-vision.mjs').catch(()=>({}));
const schema={type:'object',additionalProperties:false,properties:{pass:{type:'boolean'}},required:['pass']};
const options={apiKey:'test-key',model:'gpt-5-mini',name:'visual_verdict',schema,content:[{type:'text',text:'Compare these exact fictional-character images.'},{type:'image',source:{type:'base64',media_type:'image/jpeg',data:'ZmFrZQ=='}}]};
test('Mira vision uses exact image bytes and strict OpenAI schema without persisting images',async()=>{
  assert.equal(typeof module.requestMiraVision,'function');
  let sent;
  const value=await module.requestMiraVision({...options,fetchImpl:async(url,init)=>{
    sent={url,...init,body:JSON.parse(init.body)};
    return new Response(JSON.stringify({status:'completed',output:[{type:'function_call',name:'visual_verdict',arguments:'{"pass":false}'}]}));
  }});
  assert.deepEqual(value,{pass:false});
  assert.equal(sent.url,'https://api.openai.com/v1/responses');
  assert.equal(sent.body.store,false);
  assert.equal(sent.body.tools[0].strict,true);
  assert.equal(sent.body.input[0].content[1].image_url,'data:image/jpeg;base64,ZmFrZQ==');
  assert.equal(sent.body.input[0].content[1].detail,'high');
});
test('Mira proof rejects incomplete, wrong-tool, untyped and provider error responses',async()=>{
  assert.equal(typeof module.requestMiraVision,'function');
  for(const body of [
    {status:'incomplete',output:[{type:'function_call',name:'visual_verdict',arguments:'{"pass":true}'}]},
    {status:'completed',output:[{type:'function_call',name:'other',arguments:'{"pass":true}'}]},
    {status:'completed',output:[{type:'function_call',name:'visual_verdict',arguments:'{"pass":"true"}'}]}
  ])await assert.rejects(module.requestMiraVision({...options,fetchImpl:async()=>new Response(JSON.stringify(body))}),/VISION_/);
  await assert.rejects(module.requestMiraVision({...options,fetchImpl:async()=>new Response('{"error":{"message":"secret response must not escape"}}',{status:401})}),/VISION_PROVIDER_REQUEST_FAILED:401$/);
});
