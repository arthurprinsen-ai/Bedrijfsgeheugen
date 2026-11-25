# Frisse Blik — provider-owned booking evidence boundary

The existing embed used a raw `message` event as proof that a meeting was booked. This allowed messages from unrelated frames or scripts to trigger client-side “GESPREK GEBOEKT”, send a misleading sales confirmation and unlock the gated report.

This bounded security/CRO change retains the existing opt-in modal, prefill and Calendly widget. It validates origin (exact `https://calendly.com`), iframe source, Calendly event name and exact matching event/invitee URI shape. The event then only signals **PENDING_PROVIDER_READBACK**. It cannot create a qualified lead/confirmed meeting/paid order based on browser data.

No new scheduler, provider, database table, token, analytics tracker or recipient is added. Original explicit consent stays required. The existing email copy and report UI no longer state that a booking is confirmed. Independent server-side provider webhook/API readback remains a separately required step before the commercial ledger counts a booked meeting.

Release: canonical Brain historical/shadow/canary regressions, website static/browser, CodeQL, protected GitHub merge, Netlify production deployment SHA and public-served HTML.
