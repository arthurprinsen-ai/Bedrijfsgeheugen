/**
 * Existing canonical external-source collector: deterministic, bounded topic fairness.
 *
 * The previous (absolute 20m bucket * BATCH) selector could miss a fixed subset
 * forever when called at the same clock time every day (24h = 72 buckets;
 * for 44 topics and batch 3, the daily stride was 216 mod 44 = 40).
 *
 * Daily UTC day advancement decouples this from the fixed scheduled hour.
 * Within-day 20m windows continue to advance if the existing owner invokes
 * multiple batches. No state, new queue, scheduler, provider calls or writes.
 */
export function selectExternalTopics(topics,{now=Date.now(),batch=3}={}){
  if(!Array.isArray(topics))throw new TypeError('EXTERNAL_TOPICS_ARRAY_REQUIRED');
  const timestamp=now instanceof Date?now.getTime():Number(now);
  if(!Number.isFinite(timestamp)||timestamp<0)throw new TypeError('EXTERNAL_TOPICS_CLOCK_INVALID');
  const requested=Math.floor(Number(batch));
  if(!Number.isFinite(requested)||requested<1)throw new RangeError('EXTERNAL_TOPIC_BATCH_INVALID');
  const bounded=Math.min(12,requested);
  const day=Math.floor(timestamp/86400000);
  const window20m=Math.floor((timestamp-day*86400000)/1200000);
  if(topics.length===0)return {contract:'EXTERNAL_TOPIC_DAILY_FAIR_ROTATION-v1',
    selected:[],start:0,epochDay:day,window20m,staticFullCoverageDays:0};
  const count=Math.min(bounded,topics.length);
  const start=(((day+window20m)*count)%topics.length+topics.length)%topics.length;
  const selected=Array.from({length:count},(_,i)=>topics[(start+i)%topics.length]);
  return {contract:'EXTERNAL_TOPIC_DAILY_FAIR_ROTATION-v1',selected,start,
    epochDay:day,window20m,staticFullCoverageDays:Math.ceil(topics.length/count)};
}
