const required=(value,name)=>{
  if(value===undefined||value===null||String(value).trim()==='') throw new TypeError(`Netlify CurrentState adapter requires ${name}`);
  return String(value).trim();
};

const mapDeployState=(state)=>{
  const value=String(state||'').toLowerCase();
  if(['ready','current'].includes(value)) return {health:'healthy',capacity:'available',executionStatus:'completed',error:null};
  if(['building','processing','uploading','enqueued','pending','new'].includes(value)) return {health:'healthy',capacity:'available',executionStatus:'running',error:null};
  if(['canceled','cancelled'].includes(value)) return {health:'degraded',capacity:'interrupted',executionStatus:'interrupted',error:'NETLIFY_DEPLOY_CANCELLED'};
  if(['error','failed'].includes(value)) return {health:'unhealthy',capacity:'available',executionStatus:'failed',error:'NETLIFY_DEPLOY_ERROR'};
  if(['skipped','locked'].includes(value)) return {health:'degraded',capacity:'available',executionStatus:value,error:null};
  return {health:'unknown',capacity:'unknown',executionStatus:'unknown',error:'NETLIFY_DEPLOY_STATE_UNKNOWN'};
};

export function createNetlifyCurrentStateInput({tenantId,siteId,deployId,commitRef,siteName,deployState,publishedAt,deployUrl}={}){
  const tenant=required(tenantId,'tenantId');
  const site=required(siteId,'siteId');
  const deploy=required(deployId,'deployId');
  const revision=required(commitRef,'commitRef');
  const name=required(siteName,'siteName');
  const observedAt=required(publishedAt,'publishedAt');
  const state=String(deployState||'').toLowerCase();
  const mapped=mapDeployState(state);

  return {
    tenantId:tenant,
    source:'netlify',
    id:`netlify-current-state:${site}:${deploy}`,
    component:`netlify:${site}:${name}`,
    raw:{
      site_id:site,
      deploy_id:deploy,
      commit_ref:revision,
      published_at:observedAt,
      site_name:name,
      deploy_state:state,
      deploy_url:deployUrl===undefined||deployUrl===null?null:String(deployUrl)
    },
    observedAt,
    health:mapped.health,
    error:mapped.error,
    owner:'netlify',
    cost:null,
    revision,
    capacity:mapped.capacity,
    executionStatus:mapped.executionStatus,
    verified:true
  };
}
