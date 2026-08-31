import { getUser } from '@netlify/identity';
import { getStore } from '@netlify/blobs';
import adapterContract from '../../config/brain-platform-adapters.json' with { type: 'json' };
import { createOperatingLoopStore } from '../../brain/operating-loop/store.mjs';
import { createBlobAdapter } from '../../brain/operating-loop/netlify-adapter.mjs';
import { createBrainRuntimeAdapter } from '../../brain/operating-loop/runtime-store.mjs';
import { createOperatingLoopHandler } from '../../platform/api/brain-operating-loop-handler.mjs';
let handler;
const runtimeHandler=()=>{
  if(handler) return handler;
  const blobAdapter=String(process.env.BRAIN_STORE_BACKEND||'').toLowerCase()==='blob'
    ? createBlobAdapter(getStore({name:'brain-operating-loop',consistency:'strong'}))
    : null;
  const store=createOperatingLoopStore(createBrainRuntimeAdapter({env:process.env,blobAdapter}),{adapterContract});
  handler=createOperatingLoopHandler({getUser:()=>getUser(),store});
  return handler;
};
export default async request=>runtimeHandler()(request);
export const config={path:'/api/brain-operating-loop'};
