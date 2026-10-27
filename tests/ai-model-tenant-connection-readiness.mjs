#!/usr/bin/env node
// Connection readiness is NOT evidence verification. No secrets or customer data are printed.
import { createPublicKey } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const groups=[
 {id:'contract_vault',vars:['TENANT_CONTRACT_VERIFY_ENDPOINT','TENANT_CONTRACT_VERIFY_ALLOWED_ORIGIN','TENANT_CONTRACT_VERIFY_TOKEN']},
 {id:'provider_gateway',vars:['TENANT_LIVE_READBACK_ENDPOINT','TENANT_LIVE_READBACK_ALLOWED_ORIGIN','TENANT_LIVE_READBACK_TOKEN']},
 {id:'attestation',vars:['TENANT_ATTESTATION_VERIFY_PUBLIC_KEY_PEM']}
];
const findings=[];
for(const group of groups){
 const missing=group.vars.filter(k=>!process.env[k]);
 if(missing.length){findings.push({integration:group.id,status:'NOT_CONFIGURED',missing});continue;}
 if(group.id==='attestation'){
  try { const key=createPublicKey(process.env.TENANT_ATTESTATION_VERIFY_PUBLIC_KEY_PEM);
    if(key.asymmetricKeyType!=='ed25519')throw Error('UNSUPPORTED_VERIFY_KEY');
    findings.push({integration:group.id,status:'CONFIG_PRESENT_NOT_VERIFIED'});
  }catch{findings.push({integration:group.id,status:'INVALID_PUBLIC_VERIFY_KEY'});}
  continue;
 }
 const [targetName,allowedName]=group.vars;
 try{
  const target=new URL(process.env[targetName]),allowed=new URL(process.env[allowedName]);
  if(target.protocol!=='https:'||allowed.protocol!=='https:'||target.origin!==allowed.origin||
     target.username||target.password||allowed.username||allowed.password||target.hash)
   throw Error('INVALID_ENDPOINT_ORIGIN');
  findings.push({integration:group.id,status:'CONFIG_PRESENT_NOT_AUTHENTICATED'});
 }catch{findings.push({integration:group.id,status:'INVALID_ENDPOINT_CONFIG'});}
}

// Optional actual, signed AWS CLI account/region readback for the disputed Nova Premier.
// A configured profile and an API response are observations, never AWS's formal
// correction of its public lifecycle dates or an approved customer entitlement.
// The AWS CLI obtains credentials from the restricted runner environment.
// Do not log credential data, STS account identifiers, ARNs, or provider error text.
if (Object.hasOwn(process.env,'POWERHOUSE_BEDROCK_TARGET_REGIONS')) {
 const raw=process.env.POWERHOUSE_BEDROCK_TARGET_REGIONS||'';
 const regions=[...new Set(raw.split(',').map(x=>x.trim()).filter(Boolean))];
 const valid=regions.length>0 && regions.length<=20 &&
   regions.every(x=>/^[a-z]{2}(?:-gov)?-[a-z]+-\d$/.test(x));
 if(!valid){
  findings.push({integration:'aws_bedrock_nova_premier',status:'INVALID_REGION_CONFIGURATION'});
 }else{
  let identityVerified=false;
  try{
   const identity=JSON.parse(execFileSync('aws',['sts','get-caller-identity','--output','json','--no-cli-pager'],{
     encoding:'utf8',timeout:20000,stdio:['ignore','pipe','pipe'],maxBuffer:1024*1024
   }));
   identityVerified=/^\d{12}$/.test(String(identity?.Account||'')) &&
     /^\d{12}$/.test(process.env.POWERHOUSE_BEDROCK_EXPECTED_ACCOUNT_ID||'') &&
     identity.Account===process.env.POWERHOUSE_BEDROCK_EXPECTED_ACCOUNT_ID &&
     typeof identity?.Arn==='string' && identity.Arn.startsWith('arn:');
  }catch{ /* no untrusted AWS CLI stderr in audit output */ }
  if(!identityVerified){
   findings.push({integration:'aws_bedrock_nova_premier',status:'AWS_IDENTITY_NOT_AUTHENTICATED',regions});
  }else{
   const observations=[];
   for(const region of regions){
    try{
     const result=JSON.parse(execFileSync('aws',['bedrock','get-foundation-model',
       '--model-identifier','amazon.nova-premier-v1:0','--region',region,
       '--output','json','--no-cli-pager'],{
        encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe'],maxBuffer:1024*1024
       }));
     const details=result?.modelDetails, lifecycle=details?.modelLifecycle;
     if(details?.modelId!=='amazon.nova-premier-v1:0' ||
       !['ACTIVE','LEGACY'].includes(lifecycle?.status)) throw Error('INVALID_BEDROCK_RESPONSE');
     observations.push({region,result:'MODEL_RETURNED',lifecycle_status:lifecycle.status,
       end_of_life_time:lifecycle.endOfLifeTime??null});
    }catch{
     // A denied or missing model is not proof of EOL: permissions and regions vary.
     observations.push({region,result:'INCONCLUSIVE_API_ERROR'});
    }
   }
   findings.push({integration:'aws_bedrock_nova_premier',
     status:observations.every(x=>x.result==='MODEL_RETURNED')?
       'AUTHENTICATED_READBACK_REVIEW_PENDING':'AUTHENTICATED_READBACK_INCOMPLETE',
     model_id:'amazon.nova-premier-v1:0',
     observations,
     account_identity_checked:true,
     public_document_conflict_resolved:false,
     supplier_accepted:false,
     customer_entitlement_accepted:false,
     automatic_recommendation_eligible:false});
  }
 }
}

console.log(JSON.stringify({status:findings.every(f=>f.status.startsWith('CONFIG_PRESENT'))?
 'CONFIGURED_NOT_VERIFIED':'BLOCKED',connections:findings},null,2));
// Configuration alone must never pass a protected production acceptance gate.
process.exitCode=2;
