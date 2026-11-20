import { fileURLToPath } from 'node:url';

// Existing Security Operations schedule invokes this read-only authorization probe.
// It carries no credentials, user data or mutation payload.
export const TARGET='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-composio-instagram-auth-repair';
export async function verifyInspectorBoundary(fetchImpl=fetch){
  const checks=[
    {name:'GET',method:'GET',expected:405},
    {name:'ANON_POST',method:'POST',expected:401},
    {name:'STALE_HEADER_POST',method:'POST',headers:{'x-repair-key':'invalid-monitor-value'},expected:401}
  ];
  const results=[];
  for(const check of checks){
    try{
      const response=await fetchImpl(TARGET,{method:check.method,headers:check.headers||{},redirect:'manual',signal:AbortSignal.timeout(12000)});
      results.push({name:check.name,status:response.status,passed:response.status===check.expected});
    }catch{results.push({name:check.name,status:null,passed:false});}
  }
  return {ok:results.every(x=>x.passed),results};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const evidence=await verifyInspectorBoundary();
  console.log(JSON.stringify({fingerprint:'SECURITY_INSTAGRAM_REPAIR_AUTH_20261121',ok:evidence.ok,results:evidence.results}));
  if(!evidence.ok)process.exitCode=1;
}
