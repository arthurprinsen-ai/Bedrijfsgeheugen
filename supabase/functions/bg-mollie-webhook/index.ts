// bg-mollie-webhook — Mollie meldt alleen een betaling-id; de waarheid wordt bij Mollie zelf opgehaald (zo is de melding
// niet te vervalsen). Eerste betaling betaald -> abonnement activeren; latere betalingen -> status en periode bijwerken.
import { isMolliePaymentId } from '../_shared/mollie-billing.mjs';
import { json, serviceClient, mollie, mollieKey, handlePayment } from '../_shared/mollie-server.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let id = '';
  const type = req.headers.get('content-type') || '';
  try {
    if (type.includes('application/json')) id = String((await req.json())?.id || '');
    else id = String(new URLSearchParams(await req.text()).get('id') || '');
  } catch { return json({ error: 'invalid_request' }, 400); }
  if (!isMolliePaymentId(id)) return json({ error: 'invalid_payment_id' }, 400);
  const db = serviceClient();
  const key = await mollieKey(db);
  if (!key) return json({ error: 'webhook_not_configured' }, 503);
  let payment: any;
  try { payment = await mollie(key, `payments/${encodeURIComponent(id)}`); }
  catch (e: any) { return e?.status === 404 ? json({ received: true, ignored: 'unknown_payment' }) : json({ error: 'provider_unavailable' }, 502); }
  try { const r = await handlePayment(db, key, payment); return json({ received: true, ...r }); }
  catch { return json({ error: 'webhook_processing_failed' }, 500); }
});
