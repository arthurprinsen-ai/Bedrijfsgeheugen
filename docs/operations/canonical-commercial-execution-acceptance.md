# Canonical commercial execution acceptance contract

This document defines acceptance gates for the EXISTING Growth & Revenue OS. It does not authorize a new executor, scheduler, publisher, CRM, or direct sends.

## Source of truth
At the start of each run, load the single Brain obligation keyed by:
- obligation_type = COMMERCIAL_EXECUTION
- capability_id = daily-commercial-provider-proof-v1
- business_entity = growth-revenue-os
- business_period = current Europe/Amsterdam calendar date

Read existing powerhouse_sales_actions, canonical publication/readback ledgers, suppressions, provider send history and outcomes before claiming any action. If obligation migration is missing, use existing canonical ledgers; do not fabricate completion.

## Channel isolation and execution
The existing channel owners alone perform dispatch. Independently assess eligible relationship follow-up, Gmail (5/day maximum), LinkedIn comments (3/day maximum; one per contact per 14 days), verified-capability LinkedIn DM, LinkedIn personal/company publishers, verified-business Instagram Mira media, and protected blog publisher. A failed channel cannot abort other eligible channels. No parallel dispatch path.

Atomically claim an eligible canonical action, reconcile provider state before sending and before any retry, honor opt-out, consent, pressure, exact identity, prior outreach and per-channel permissions. Retry only recoverable errors with bounded backoff. Never requeue into a new table or duplicate an already provider-accepted action.

## Provider proof
Email: provider message ID, thread ID, exact recipient, exact copy, timestamp and canonical action ID.
Social: external object ID, permalink, exact text/media and timestamp.
Blog: publicly reachable canonical production URL, live_proven_at and independent readback.
Only provider/public-verified action changes daily obligation to FULFILLED. Provider accepted, generated, scheduled, done, zero output, clicks, likes and predictions alone are not proof of realized revenue.

## Learning and revenue
Write evidence to original action and Brain/outcome lineage. Schedule meaningful 24h, 72h and 7d follow-up through existing owners. Track observed leads, orders and REALIZED revenue separately toward EUR 1,000,000 by 2027-09-01. Preserve existing main-to-Netlify production-readback obligation.

## Verification tests required before merge
1. Already-sent provider message does not send again.
2. Suppressed, unauthorized or pressured contact never sends.
3. Gmail provider failure does not block eligible blog or social publication.
4. A missing LinkedIn admin scope does not block other channels.
5. A provider-accepted-but-unreadable social post leaves obligation OPEN.
6. Public blog URL readback failure leaves obligation OPEN.
7. Concurrent workers claim a canonical action at most once.
8. The OpenAI key is read securely without logging its value.
9. No eligible action records NO_ELIGIBLE_ACTION/OPEN, not FULFILLED.
10. Protected merge, production deploy and readback are separately evidenced.
