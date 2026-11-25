# Frisse Blik / Bedrijfslek — verified scan claims update every live tenant page

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation: `portal|verified-scan-claim-to-brain-pages|20261020`

## Source and root cause
The existing `/api/portal-scans` endpoint uses Netlify Identity and passes tenant-bound claims to Supabase's `powerhouse-scan-ingest` Edge Function. That function verifies ownership, stores canonical Brain projection `portal.assessments.bedrijfslekScan` (truth class SELF_REPORTED), emits a deduped runtime event and only then replies `claimed:true`. Previously `portal-v2/scan-claim-bridge.js` only refreshed scan history after provider ACK. Every other live dashboard displayed the old canonical projection until login/reload/periodic refresh.

## Implementation
- In the existing scan bridge invoke `onClaimed` only after verified POST `ok=true`, `claimed=true` and scan ownership verified; include the current authenticated identity and projection flags, **not** the anonymous receipt.
- The existing app connects this callback to `portalDomainState.refresh()` only when the principal matches throughout the original claim.
- The canonical refresh is tenant-scoped and fail-closed against unsaved forms, pending BusinessInput/organism ACK and in-flight edits; opening dashboards with newly committed scan context causes a read-model refresh without any new event-sourcing layer or duplicate scheduler.
- If canonical refresh fails, the scan remains claimed. It must never be resent simply because display readback failed. If the claim POST failed, nothing is propagated.

## Truth and security
The scan is self-reported and not an independently verified financial fact. It cannot mark an action executed, increase actual revenue, or certify EU AI Act/CSRD compliance. The provider's verified *identity* does not verify self-reported *business performance*. No new external provider access or connector installation.

## Acceptance and further work
Required CI, CodeQL, protected merge, immutable Netlify source readback, Chrome two-tenant claim-to-dashboard navigation, source revision comparison, and valid analytics/outcome feedback checks. Full One Brain data/CRM/Notion/Supabase learning cross-application path remains independently open under #4215 until provider receipts.
