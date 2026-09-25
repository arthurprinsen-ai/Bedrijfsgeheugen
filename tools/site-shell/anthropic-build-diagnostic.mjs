import fs from 'node:fs';

const branch=String(process.env.BRANCH||'');
if(!branch.startsWith('diagnostic/i18n-provider-')) process.exit(0);

const key=String(process.env.ANTHROPIC_API_KEY||'').trim();
const result={branch,key_present:Boolean(key),status:null,error_type:null,message:null,model:'claude-haiku-4-5-20251001'};
if(!key){
  result.message='ANTHROPIC_API_KEY missing';
} else {
  try{
    const response=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:result.model,max_tokens:64,messages:[{role:'user',content:'Return exactly: ["Hello"]'}]})
    });
    result.status=response.status;
    const body=await response.text();
    let parsed={}; try{parsed=JSON.parse(body)}catch{}
    result.error_type=parsed?.error?.type||null;
    result.message=String(parsed?.error?.message|| (response.ok?'ok':'request_failed')).slice(0,300);
  }catch(error){
    result.message=String(error?.message||error).slice(0,300);
  }
}
fs.writeFileSync('anthropic-build-diagnostic.json',JSON.stringify(result,null,2)+'\n');
console.log('ANTHROPIC_BUILD_DIAGNOSTIC',JSON.stringify({key_present:result.key_present,status:result.status,error_type:result.error_type,message:result.message}));
