# SEO → sales conversion integrity: Frisse Blik real provider receipt (5 November 2026)

## Verified source and business problem
The existing public `frisse-blik.html` funnel posted personal details and a scan to active original Supabase Edge Function `lead-intake`. The provider function v1 returns HTTP 200 `{ok:true}` only after its original insert into `commercial_leads`. Rejected/failed storage returns non-2xx; no direct `frisse-blik` lead rows were independently present at the 5 November check. The source frontend swallowed network failures and could advance to calendar silently. It also called `onBooked('geen-calendly-geconfigureerd')` if Calendly config was absent, although no real external appointment existed. Its post-booking backup advisory message accepted potential delivery failure without an explicit status.

**Why this matters:** a top-ranking page that collects a CTA but silently loses its form cannot be a sales machine. Clicks, scan completions and HTML success screens are not provider-confirmed leads, and a Calendly iframe event is not a provider-verified completed appointment.

## Bounded repair in original website source
- In the same `frisse-blik.html`, accept registration only on HTTP success **and** JSON `ok:true`; no fabricated lead or storage retry.
- Show a non-sensitive visible warning on non-2xx, missing receipt, network failure or missing lead-intake config. Allow scheduling in the existing Calendly widget; do not invent a booking on missing Calendly configuration.
- Avoid two in-flight submissions (protecting the original idempotent backend). Distinguish the server's `ok:true` from independent Calendly booking and advisory-email delivery.
- Link to the existing public contact page using a full URL. Preserve original consent, booking UI identity guard, no client-side secrets, customer privacy, source ingestion, CRM and commercial owners.
- Strict original static English cache patch, historical-replay Node test with entirely synthetic `example.invalid` personal details and mocked HTTP/network outcomes, no test writes to production or fake leads.
- No parallel controller, CRM, scheduler or writer; do not claim live until exact protected Required/BRAIN/CodeQL, Netlify SHA, and independent website render/browser checks.

## Measurement after release
Original SEO/Growth agents must evaluate real GSC nonbrand organic query→landing→consented CTA→**provider-confirmed commercial_leads**→qualified/appointment→won→provider-paid receipt. Compare two full identical weeks and track 7/28/56-day cohorts without false green or counting synthetic previews. Test data must never enter production lead metrics. This change fixes transparency and local receipt handling; it does not prove any organic traffic or revenue growth.
