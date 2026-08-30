import {getStore} from '@netlify/blobs';
import {createOperatingLoopStore} from '../../brain/operating-loop/store.mjs';
import {createBlobAdapter} from '../../brain/operating-loop/netlify-adapter.mjs';
import {createServiceIngestHandler} from '../../platform/api/brain-operating-service-handler.mjs';
const parseCredentials=()=>{try{const value=JSON.parse(process.env.BRAIN_SERVICE_CREDENTIALS_JSON||'[]');return Array.isArray(value)?value:[];}catch{return [];}};
const blobs=getStore({name:'brain-operating-loop',consistency:'strong'});
const store=createOperatingLoopStore(createBlobAdapter(blobs));
export default async request=>createServiceIngestHandler({store,credentials:parseCredentials()})(request);
export const config={path:'/api/brain-operating-ingest'};
