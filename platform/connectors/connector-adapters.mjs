export function runtimeAdapterStatus(adapterMeta,provider){
  if(provider)return {configured:true,state:'configured'};
  if(adapterMeta?.runtimeCapability==='native-safe-test')return {configured:true,state:'native-safe-test'};
  return {configured:false,state:'not-configured'};
}

export function requireAdapter(adapters,name){
  const adapter=adapters?.[name];
  if(!adapter)throw Object.assign(new Error(`Adapter not configured: ${name}`),{code:'ADAPTER_NOT_CONFIGURED',adapter:name});
  return adapter;
}
