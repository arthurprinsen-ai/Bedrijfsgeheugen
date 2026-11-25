// Canonical Gmail provider readback decoder: Composio's Gmail fetch returns
// messageId (camelCase), not necessarily id or message_id. Never count a
// send without exact requested message ID, SENT label AND exact recipient.
const clean = value => String(value ?? '').trim();
export function verifiedGmailReadback(data, requestedId, recipient) {
  const d = data?.data?.data ?? data?.data ?? data ?? {};
  const message = d?.message ?? d;
  const ids = [message?.messageId, message?.message_id, message?.id]
    .map(clean).filter(Boolean);
  const expected = clean(requestedId);
  const id = ids.find(v => v === expected) ?? ids[0] ?? '';
  const labels = Array.isArray(message?.labelIds) ? message.labelIds :
    (Array.isArray(message?.label_ids) ? message.label_ids : []);
  const headers = Array.isArray(message?.payload?.headers) ? message.payload.headers :
    (Array.isArray(message?.headers) ? message.headers : []);
  const toHeader = headers.find(h => clean(h?.name).toLowerCase() === 'to');
  const target = clean(recipient).toLowerCase();
  const addressed = clean(toHeader?.value || message?.to).toLowerCase();
  const recipients = (addressed.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [])
    .map(v => v.toLowerCase());
  const id_matches = Boolean(expected && id === expected);
  const sent_label = labels.includes('SENT');
  const recipient_matches = Boolean(target && recipients.includes(target));
  return {
    ok: id_matches && sent_label && recipient_matches,
    id_matches, sent_label, recipient_matches,
    message_id: id_matches ? id : '',
    thread_id: clean(message?.threadId || message?.thread_id)
  };
}
