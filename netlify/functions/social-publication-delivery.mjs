// Deprecated compatibility endpoint. Canonical social writes and provider truth are
// owned exclusively by the approved Supabase powerhouse-social-publisher.
// No Buffer credentials, scheduling, provider writes or parallel dispatches here.
const CONTRACT = 'LEGACY_BUFFER_SOCIAL_WRITER_RETIRED_V1';
const STATE_RANK = Object.freeze({ PLANNED:10, GENERATED:20, APPROVED:30, DISPATCHED:40, PUBLISHED:50, LIVE_PROVEN:60, MEASURED:70, LEARNED:80, BLOCKED:90, FAILED:90 });

function offsetMinutesAt(date, timeZone='Europe/Amsterdam') {
  const value = new Intl.DateTimeFormat('en-US',{timeZone,timeZoneName:'longOffset',hour:'2-digit'})
    .formatToParts(date).find(part=>part.type==='timeZoneName')?.value||'GMT+00:00';
  const match=value.match(/GMT([+-])(\d{2}):(\d{2})/);
  if(!match)return 0;
  const minutes=Number(match[2])*60+Number(match[3]);
  return match[1]==='-'?-minutes:minutes;
}
export function localMidnightUtc(dateString,timeZone='Europe/Amsterdam') {
  const base=Date.parse(`${dateString}T00:00:00Z`);
  let instant=new Date(base);
  for(let i=0;i<3;i++)instant=new Date(base-offsetMinutesAt(instant,timeZone)*60_000);
  return instant.toISOString();
}
export function localDayWindow(dateString) {
  const next=new Date(`${dateString}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate()+1);
  return {start:localMidnightUtc(dateString),end:localMidnightUtc(next.toISOString().slice(0,10))};
}
// Read-only compatibility helper retained for historical analytics tests.
// It MUST NOT authorize a new provider write or promote an unverified receipt.
export function providerReconciliationState(obligationStatus,providerStatus) {
  const current=STATE_RANK[String(obligationStatus||'PLANNED')]??0;
  const provider=String(providerStatus||'').toLowerCase();
  if(provider==='sent'&&current<STATE_RANK.LIVE_PROVEN)return 'LIVE_PROVEN';
  if(['scheduled','sending'].includes(provider)&&current<STATE_RANK.DISPATCHED)return 'DISPATCHED';
  return null;
}
export async function runSocialPublicationDelivery() {
  return Object.freeze({
    ok:false,
    contract:CONTRACT,
    reason:'RETIRED_DUPLICATE_BUFFER_SENDER',
    canonical_executor:'supabase:powerhouse-social-publisher',
    provider_write_performed:false,
    delivery_claimed:false,
  });
}
export default async function handler() {
  return Response.json(await runSocialPublicationDelivery(),{
    status:410,
    headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'},
  });
}
// No cron/schedule: the existing canonical executor remains enabled.
export const config={region:'fra'};
