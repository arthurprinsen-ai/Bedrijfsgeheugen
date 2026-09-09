const getPath=(source,path)=>String(path||'').split('.').filter(Boolean).reduce((value,key)=>value==null?undefined:value[key],source);
const filled=value=>Array.isArray(value)?value.length>0:value!==undefined&&value!==null&&String(value).trim()!=='';

export function calculateCompletion(schema=[],state={}){
 const required=schema.filter(field=>field.required);
 const missing=required.filter(field=>!filled(getPath(state,field.path))).map(field=>field.id);
 const total=required.length;const complete=total-missing.length;
 return Object.freeze({complete,total,percentage:total?Math.round((complete/total)*100):100,missing});
}
