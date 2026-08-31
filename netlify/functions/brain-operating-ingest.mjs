import {getStore} from '@netlify/blobs';
import {createOperatingLoopStore} from '../../brain/operating-loop/store.mjs';
import {createBlobAdapter} from '../../brain/operating-loop/netlify-adapter.mjs';
import {createBrainRuntimeAdapter} from '../../brain/operating-loop/runtime-store.mjs';
import {createServiceIngestHandler} from '../../platform/api/brain-operating-service-handler.mjs';
const parseCredentials=()=>{try{const value=JSON.parse(process.env.BRAIN_SERVICE_CREDENTIALS_JSON||'[]');return Array.isArray(value)?value:[];}catch{return [];}};
let store;
const runtimeStore=()=>{
  if(store) return store;
  const blobAdapter=String(process.env.BRAIN_STORE_BACKEND||'').toLowerCase()==='blob'
    ? createBlobAdapter(getStore({name:'brain-operating-loop',consistency:'strong'}))
    : null;
  store=createOperatingLoopStore(createBrainRuntimeAdapter({env:process.env,blobAdapter}));
  return store;
};
export default async request=>createServiceIngestHandler({store:runtimeStore(),credentials:parseCredentials()})(request);
export const config={path:'/api/brain-operating-ingest'};
