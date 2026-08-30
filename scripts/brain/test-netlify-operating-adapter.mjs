import {createBlobAdapter} from '../../brain/operating-loop/netlify-adapter.mjs';

const values=new Map();
const blobStore={
  async get(key){return values.get(key)||null;},
  async setJSON(key,value){values.set(key,value);return {modified:true};},
  async list({prefix}){return {blobs:[...values.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))};}
};

const adapter=createBlobAdapter(blobStore);
await adapter.put('tenant/records/1',{x:1});
await adapter.put('tenant/records/2',{x:2});
const one=await adapter.get('tenant/records/1');
if(one.x!==1) throw new Error('blob adapter get/put failed');
const listed=await adapter.list('tenant/records/');
if(listed.length!==2||listed.some(x=>!x.value)) throw new Error('blob adapter must hydrate listed records');
console.log('netlify operating adapter tests passed');
