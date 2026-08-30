import { getUser } from '@netlify/identity';
import { getStore } from '@netlify/blobs';
import { createOperatingLoopStore } from '../../brain/operating-loop/store.mjs';
import { createBlobAdapter } from '../../brain/operating-loop/netlify-adapter.mjs';
import { createOperatingLoopHandler } from '../../platform/api/brain-operating-loop-handler.mjs';

const blobs=getStore({name:'brain-operating-loop',consistency:'strong'});
const store=createOperatingLoopStore(createBlobAdapter(blobs));
const handler=createOperatingLoopHandler({getUser:()=>getUser(),store});

export default async request=>handler(request);
export const config={path:'/api/brain-operating-loop'};
