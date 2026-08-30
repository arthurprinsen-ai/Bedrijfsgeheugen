export function createBlobAdapter(store){
  if(!store?.get||!store?.setJSON||!store?.list) throw new TypeError('Blob adapter requires get/setJSON/list');
  return Object.freeze({
    async get(key){
      return await store.get(key,{type:'json',consistency:'strong'});
    },
    async put(key,value){
      await store.setJSON(key,value);
      return value;
    },
    async list(prefix=''){
      const page=await store.list({prefix});
      const blobs=Array.isArray(page?.blobs)?page.blobs:[];
      const hydrated=await Promise.all(blobs.map(async blob=>({key:blob.key,value:await store.get(blob.key,{type:'json',consistency:'strong'})})));
      return hydrated.filter(entry=>entry.value!==null&&entry.value!==undefined);
    }
  });
}
