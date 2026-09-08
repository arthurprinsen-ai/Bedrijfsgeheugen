const clean=v=>String(v??'').trim();

export function sourceRef(input={}){
  const ref={
    system:clean(input.system),
    kind:clean(input.kind),
    id:clean(input.id),
    ...(input.url?{url:clean(input.url)}:{}),
    ...(input.sha?{sha:clean(input.sha)}:{}),
    ...(input.version?{version:clean(input.version)}:{}),
    ...(input.execution_id?{execution_id:clean(input.execution_id)}:{}),
    ...(input.deploy_id?{deploy_id:clean(input.deploy_id)}:{}),
    relationship:clean(input.relationship)||'evidence'
  };
  if(!ref.system||!ref.kind||!ref.id) throw new TypeError('source reference requires system, kind and id');
  return Object.freeze(ref);
}
