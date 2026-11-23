// Exact acknowledgement contract for the EXISTING Powerhouse growth event/outcome writer.
// HTTP 200/202 alone is only an HTTP receipt; never convert it into "persisted".
// The Supabase RPC is idempotent; an exact matching deduped readback is valid.
export function validateDatahubAck(kind,record,body) {
  if (kind !== 'event' && kind !== 'outcome') return false;
  const sourceId = kind === 'event'
    ? record?.datahub_event?.event_id
    : record?.outcome?.outcome_id;
  if (typeof sourceId !== 'string' || !sourceId) return false;
  const expectedTable = kind === 'event' ? 'supabase:growth_events' : 'supabase:growth_outcomes';
  const expectedKey = kind === 'event' ? 'event_id' : 'outcome_id';
  const receipt = body?.result;
  if (body?.datahub !== expectedTable || !receipt || typeof receipt !== 'object') return false;
  if (receipt[expectedKey] !== sourceId || receipt.queue_id !== kind + ':' + sourceId) return false;
  if (receipt.stored !== true && receipt.deduped !== true) return false;
  if (receipt.stored === true && receipt.deduped === true) return false;
  return true;
}
