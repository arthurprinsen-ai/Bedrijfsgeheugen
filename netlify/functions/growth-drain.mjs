import { drainGrowthQueue } from './growth-replay.mjs';

const MAX_BATCH=10;

export default async function handler(){
  const result=await drainGrowthQueue({maxReplay:MAX_BATCH,includeOutcomes:true});
  console.log(JSON.stringify({event:'growth-drain',accepted:result.accepted,replayed:result.replayed,persisted:result.persisted,delivered:result.delivered,failed:result.failed,budgetExpired:result.budgetExpired,elapsedMs:result.elapsedMs,pages:result.pages,scanned:result.scanned,skippedPersisted:result.skippedPersisted,indexedSeen:result.indexedSeen,indexedCompleted:result.indexedCompleted,indexIntegrityFailures:result.indexIntegrityFailures,indexSourceMissing:result.indexSourceMissing,indexPointerInvalid:result.indexPointerInvalid,indexPointerGone:result.indexPointerGone,indexReadFailures:result.indexReadFailures,providerFailed:result.providerFailed,healthy:result.healthy}));
  // A 204 must mean no actual failure. Failures are visible to observers and
  // source/index records remain durable for idempotent minute-cron retry.
  return new Response(null,{status:result.failed>0?503:204});
}

export const config={schedule:'* * * * *'};
