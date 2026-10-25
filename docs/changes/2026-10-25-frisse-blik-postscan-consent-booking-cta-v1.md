# Frisse Blik post-scan booking CTA — 2026-10-25

The existing scan yields an anonymous result and already contains a consent-gated lead modal and connected 30-minute Calendly provider booking. In the last seven days production recorded 14 non-robot flagged scan_completed events (7 Frisse Blik, 7 Zelfscan), but the canonical commercial_leads table contains zero rows. This does **not** prove the specific cause of the drop-off.

Minimal, reversible conversion hypothesis: add one visible result-area button after the recommendation, outside blurred or modal content. It calls the **same** `openLead()` existing consent modal and existing Calendly event. No extra scheduler, CRM, vendor, user-tracking cookies, impersonation, cold outreach, changes to offer price or final report gating. The form still requires name, business email, company and explicit permission; anonymous scan visitors remain anonymous.

The existing website static regression suite `node --test tests/site-shell-cta-conversie.test.mjs` now asserts the placement, consent check and canonical Calendly reuse. Required, CodeQL, Netlify preview, protected merge and independent production readback must succeed. Observe actual booked event IDs before counting qualified leads; financial orders require separate proof.
