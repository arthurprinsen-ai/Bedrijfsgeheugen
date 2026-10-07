import { drainGrowthQueue } from './growth-replay.mjs';

const MAX_BATCH=10;

export default async function handler(){
  const result=await drainGrowthQueue({maxReplay:MAX_BATCH,includeOutcomes:true});
  console.log(JSON.stringify({event:'growth-drain',accepted:result.accepted,replayed:result.replayed,persisted:result.persisted,delivered:result.delivered,failed:result.failed}));
  return new Response(null,{status:204});
}

export const config={schedule:'* * * * *'};
