// Customer-selected AI infrastructure is desired state, never a provisioning receipt.
export const AI_DEPLOYMENT_OPTIONS=Object.freeze({
 deploymentMode:Object.freeze(['MANAGED_CLOUD','PRIVATE_CLOUD','ON_PREMISE','AIR_GAPPED']),
 provider:Object.freeze(['ANTHROPIC','AZURE_OPENAI','AWS_BEDROCK','GOOGLE_VERTEX','MISTRAL_API','OLLAMA','VLLM']),
 modelFamily:Object.freeze(['CURRENT','MISTRAL','GEMMA','LLAMA','CUSTOM']),
 computeRegion:Object.freeze(['AUTO','EU','NL','DE','US','LOCAL']),
 storageRegion:Object.freeze(['AUTO','EU','NL','DE','US','LOCAL']),
 ragRegion:Object.freeze(['SAME_AS_STORAGE','EU','NL','DE','US','LOCAL']),
 networkMode:Object.freeze(['STANDARD','PRIVATE_ENDPOINT','OFFLINE'])
});
export const CURRENT_AI_DEPLOYMENT_PROFILE=Object.freeze({
 deploymentMode:'MANAGED_CLOUD',provider:'ANTHROPIC',modelFamily:'CURRENT',
 computeRegion:'AUTO',storageRegion:'AUTO',ragRegion:'SAME_AS_STORAGE',
 networkMode:'STANDARD',trainingUse:'PROHIBITED',allowExternalFallback:false,modelId:''
});
const fail=()=>{throw Object.assign(new Error('INVALID_AI_DEPLOYMENT_PROFILE'),{code:'INVALID_AI_DEPLOYMENT_PROFILE'});};
export function validateCustomerAiDeployment(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail();
 const expected=new Set(Object.keys(CURRENT_AI_DEPLOYMENT_PROFILE));
 if(Object.keys(input).some(k=>!expected.has(k)))fail();
 const profile={...CURRENT_AI_DEPLOYMENT_PROFILE,...input};
 for(const [key,options] of Object.entries(AI_DEPLOYMENT_OPTIONS))
  if(!options.includes(profile[key]))fail();
 if(profile.trainingUse!=='PROHIBITED'||profile.allowExternalFallback!==false)fail();
 if(typeof profile.modelId!=='string'||profile.modelId.length>120||!/^[a-zA-Z0-9._:/-]*$/.test(profile.modelId))fail();
 if(['ON_PREMISE','AIR_GAPPED'].includes(profile.deploymentMode)){
  if(!['OLLAMA','VLLM'].includes(profile.provider)||profile.computeRegion!=='LOCAL'||profile.storageRegion!=='LOCAL'||!['LOCAL','SAME_AS_STORAGE'].includes(profile.ragRegion))fail();
 }
 if(profile.deploymentMode==='AIR_GAPPED'&&profile.networkMode!=='OFFLINE')fail();
 if(profile.networkMode==='OFFLINE'&&profile.deploymentMode!=='AIR_GAPPED')fail();
 if(['OLLAMA','VLLM'].includes(profile.provider)&&!['ON_PREMISE','AIR_GAPPED','PRIVATE_CLOUD'].includes(profile.deploymentMode))fail();
 return Object.freeze(profile);
}
export function canUseCurrentAiRoute(profile){
 if(profile==null)return true; // Pre-existing tenant behaviour, no new claims.
 let value;
 try{value=validateCustomerAiDeployment(profile)}catch{return false;}
 return Object.keys(CURRENT_AI_DEPLOYMENT_PROFILE).every(key=>value[key]===CURRENT_AI_DEPLOYMENT_PROFILE[key]);
}
