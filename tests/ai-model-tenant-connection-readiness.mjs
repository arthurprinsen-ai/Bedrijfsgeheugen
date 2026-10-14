#!/usr/bin/env node
// Connection readiness is NOT evidence verification. No secrets or customer data are printed.
const groups=[
 {id:'contract_vault',vars:['TENANT_CONTRACT_VERIFY_ENDPOINT','TENANT_CONTRACT_VERIFY_ALLOWED_ORIGIN','TENANT_CONTRACT_VERIFY_TOKEN']},
 {id:'provider_gateway',vars:['TENANT_LIVE_READBACK_ENDPOINT','TENANT_LIVE_READBACK_ALLOWED_ORIGIN','TENANT_LIVE_READBACK_TOKEN']},
 {id:'attestation',vars:['TENANT_ATTESTATION_VERIFY_PUBLIC_KEY_PEM']}
];
const findings=[];
for(const group of groups){
 const missing=group.vars.filter(k=>!process.env[k]);
 if(missing.length){findings.push({integration:group.id,status:'NOT_CONFIGURED',missing});continue;}
 if(group.id==='attestation'){findings.push({integration:group.id,status:'CONFIG_PRESENT_NOT_VERIFIED'});continue;}
 const [targetName,allowedName]=group.vars;
 try{
  const target=new URL(process.env[targetName]),allowed=new URL(process.env[allowedName]);
  if(target.protocol!=='https:'||allowed.protocol!=='https:'||target.origin!==allowed.origin||
     target.username||target.password||allowed.username||allowed.password||target.hash)
   throw Error('INVALID_ENDPOINT_ORIGIN');
  findings.push({integration:group.id,status:'CONFIG_PRESENT_NOT_AUTHENTICATED'});
 }catch{findings.push({integration:group.id,status:'INVALID_ENDPOINT_CONFIG'});}
}
console.log(JSON.stringify({status:findings.every(f=>f.status.startsWith('CONFIG_PRESENT'))?
 'CONFIGURED_NOT_VERIFIED':'BLOCKED',connections:findings},null,2));
if(findings.some(f=>!f.status.startsWith('CONFIG_PRESENT')))process.exitCode=2;
