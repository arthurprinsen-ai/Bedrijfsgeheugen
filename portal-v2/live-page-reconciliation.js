// Existing Portal V2 runtime read model only; pure proof comparison and fail-closed redraw policy.
export function runtimeEvidenceVersion(runtime){
  if(runtime==null)return 'null';
  try{return JSON.stringify(runtime);}catch{return 'unavailable';}
}
export function shouldReconcileRuntimePage({open=false,authenticated=false,versionChanged=false,status='idle',editing=false}={}){
  return Boolean(open&&authenticated&&versionChanged&&(status==='idle'||status==='saved')&&!editing);
}
