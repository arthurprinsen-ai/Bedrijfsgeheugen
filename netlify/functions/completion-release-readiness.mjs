const env=(name)=>String(globalThis.Netlify?.env?.get?.(name)||process.env[name]||'').trim();
const sha=value=>/^[0-9a-f]{40}$/i.test(value);

export default async ()=>{
  const commitRef=env('COMMIT_REF');
  const deployId=env('DEPLOY_ID');
  const context=env('CONTEXT');
  const branch=env('BRANCH');
  const url=env('URL')||'https://www.bedrijfsgeheugen.nl';
  const deployUrl=env('DEPLOY_URL');
  const ready=sha(commitRef)&&Boolean(deployId)&&context==='production';

  return Response.json({
    contract:'powerhouse-completion-release-readiness-v1',
    ready,
    commit_ref:commitRef||null,
    deploy_id:deployId||null,
    context:context||null,
    branch:branch||null,
    url,
    deploy_url:deployUrl||null,
    observed_at:new Date().toISOString()
  },{
    status:ready?200:503,
    headers:{'cache-control':'no-store'}
  });
};

export const config={path:'/api/completion/release-readiness'};
