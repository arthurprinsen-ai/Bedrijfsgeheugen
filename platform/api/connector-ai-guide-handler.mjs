const FORBIDDEN_KEY=/(?:secret|token|password|api[_-]?key|ready|healthy|execution(?:id|[_-]?id)?)/i;
const TOP_LEVEL=new Set(['summary','suggestions','missingQuestions','proposedDefinition']);

function cleanValue(value){
  if(Array.isArray(value))return value.map(cleanValue);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key])=>!FORBIDDEN_KEY.test(key))
    .map(([key,item])=>[key,cleanValue(item)]));
}

export function sanitizeAiGuideResult(input={}){
  const source=input&&typeof input==='object'?input:{};
  const output={};
  for(const [key,value] of Object.entries(source)){
    if(TOP_LEVEL.has(key)&&!FORBIDDEN_KEY.test(key))output[key]=cleanValue(value);
  }
  if(typeof output.summary!=='string')output.summary='';
  if(!Array.isArray(output.suggestions))output.suggestions=[];
  if(!Array.isArray(output.missingQuestions))output.missingQuestions=[];
  if(!output.proposedDefinition||typeof output.proposedDefinition!=='object'||Array.isArray(output.proposedDefinition))output.proposedDefinition={};
  return Object.freeze(output);
}

const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

export function createConnectorAiGuideHandler({getUser,propose}={}){
  if(typeof getUser!=='function'||typeof propose!=='function')throw new TypeError('getUser and propose are required');
  return async request=>{
    if(request.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
    const user=await getUser(request);
    if(!user)return json(401,{error:'UNAUTHORIZED'});
    let body;
    try{body=await request.json();}catch{return json(400,{error:'INVALID_JSON'});}
    const intent=typeof body?.intent==='string'?body.intent.trim():'';
    if(!intent||intent.length>2000)return json(400,{error:'INVALID_INTENT'});
    const currentState=body?.currentState&&typeof body.currentState==='object'&&!Array.isArray(body.currentState)?cleanValue(body.currentState):{};
    try{
      const proposed=await propose({intent,currentState,userId:user.id||user.sub||null});
      return json(200,sanitizeAiGuideResult(proposed));
    }catch(error){
      console.error('connector-ai-guide failed',{name:error?.name||'Error',code:error?.code||null});
      return json(502,{error:'AI_GUIDE_UNAVAILABLE'});
    }
  };
}
