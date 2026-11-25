// Same exact-image proof contract for both Mira verifiers; no provider fallback.
export async function requestMiraVision({apiKey,model,name,schema,content,instructions='',fetchImpl=fetch}) {
  if(!apiKey||!model)throw new Error('VISION_CONFIGURATION_REQUIRED');
  const input=content.map(item=>{
    if(item.type==='text')return {type:'input_text',text:item.text};
    if(item.type==='image'&&item.source?.type==='base64'&&['image/jpeg','image/png'].includes(item.source.media_type)&&item.source.data)
      return {type:'input_image',image_url:`data:${item.source.media_type};base64,${item.source.data}`,detail:'high'};
    throw new Error('VISION_IMAGE_INPUT_INVALID');
  });
  const response=await fetchImpl('https://api.openai.com/v1/responses',{
    method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'content-type':'application/json'},
    signal:AbortSignal.timeout(90000),
    body:JSON.stringify({model,store:false,instructions,input:[{role:'user',content:input}],
      reasoning:{effort:'minimal'},max_output_tokens:2000,
      tools:[{type:'function',name,description:'Conservative exact-media verification verdict.',strict:true,parameters:schema}],
      tool_choice:{type:'function',name},parallel_tool_calls:false})
  });
  if(!response.ok)throw new Error(`VISION_PROVIDER_REQUEST_FAILED:${response.status}`);
  const body=await response.json();
  if(body.status!=='completed')throw new Error('VISION_RESPONSE_INCOMPLETE');
  const items=(body.output||[]).filter(item=>item.type==='function_call'&&item.name===name);
  if(items.length!==1)throw new Error('VISION_TOOL_OUTPUT_MISSING');
  let verdict;
  try{verdict=JSON.parse(items[0].arguments);}catch{throw new Error('VISION_TOOL_OUTPUT_INVALID');}
  if(!verdict||typeof verdict!=='object'||Array.isArray(verdict))throw new Error('VISION_TOOL_OUTPUT_INVALID');
  for(const key of schema.required||[]) {
    const type=schema.properties?.[key]?.type;
    const value=verdict[key];
    if(typeof value!==type||(type==='number'&&!Number.isFinite(value)))throw new Error('VISION_TOOL_OUTPUT_INVALID');
    const rule=schema.properties[key];
    if(rule.enum&&!rule.enum.includes(value))throw new Error('VISION_TOOL_OUTPUT_INVALID');
    if(type==='number'&&((rule.minimum!==undefined&&value<rule.minimum)||(rule.maximum!==undefined&&value>rule.maximum)))throw new Error('VISION_TOOL_OUTPUT_INVALID');
  }
  if(Object.keys(verdict).some(key=>!Object.hasOwn(schema.properties,key)))throw new Error('VISION_TOOL_OUTPUT_INVALID');
  return verdict;
}
