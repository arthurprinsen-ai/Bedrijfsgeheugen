# 2026-11-09 — CRO first-party CTA label quality recovery
Verified original page click tracking used the generic HTML tag as the primary label whenever a static analytics ID was absent. On /prijzen this surfaced as BUTTON, which the original experiment planner erroneously considered visible copy. The site may not have a corresponding visible text 'BUTTON'; instrument quality and actual marketing performance must be separated.

This narrowly scoped patch in original assets/meting.js uses explicit author-defined data-bg-meet, data-bg-conversion or data-bg-order-cta, then existing id/tag fallback. It does not read customer-visible text, inputs, or arbitrary HTML and does not add a second growth producer, scheduler, data storage or PII. Existing consent and durable event_uid ACK remain the authority.

No website improvement, user action, increment to traffic, A/B uplift or paid order is claimed from static success. Protected Required/BRAIN/CodeQL, protected merge, Netlify production exact SHA, browser/canonical data readback and subsequent actual decision-application proof are independently required. Parent commercial issues #4900 and #4198; source antecedents #5542 and #5544.
