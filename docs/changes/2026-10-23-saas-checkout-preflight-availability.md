# SaaS checkout: stop taking details when live payment is unavailable

**Affected page:** `https://www.bedrijfsgeheugen.nl/afsluiten`.

A browser now asks the existing read-only billing readiness endpoint whether self-service payments can be accepted before enabling the company-name, email and purchase controls. When the backend returns no/false readiness, an error response, or no response, the form is disabled and the same previously translated payment-unavailable message is shown to customers with accessible status announcements.

The existing paid checkout, annual/monthly pricing, idempotent Stripe intent flow, verified purchase-success readback and account handoff stay intact when payment is enabled. A return from payment does not depend on new purchase availability: customers may still have an earlier payment awaiting confirmation.

**Testing and release:** The original shared Playwright checkout fixture is extended with simulated enabled and disabled provider states on NL/EN pages and desktop/mobile. No real payments, customers, or secrets are created. Protected CI/CodeQL, Netlify preview, merge and production evidence are mandatory. Real payment acceptance still requires authorized Stripe live keys/webhook and two independent customer/tenant readbacks.
