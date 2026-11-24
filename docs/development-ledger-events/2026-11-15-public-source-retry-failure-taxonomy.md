# P0 2026-11-15 native 10x SOURCE_HTML_UNAVAILABLE — cause and prevention

Owner: original-agent:commercial + existing #116/#138 and agent-reliability.
Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

**Observed failure:** Original production 18:07 UTC re-ran 2 historical due research actions (both unreadable, 0 candidates), leaving 10 open source debts and 4 unproven commercial handoffs. The existing Edge source reader returned null for transport/HTTP/type/size/redirect without preserving a cause in the ORIGINAL research action. Multiple same-host retries were blind and the backoff was fixed 4h despite 5 attempts.

**Root cause:** exception and failure categories collapsed into `SOURCE_HTML_UNAVAILABLE`, preventing decision and continuing 4-hour retry starvation. Existing first-party eight-slot daily rotation is unaffected.

**Corrective change:** One original Edge reader now reports only bounded categorical failures and retains source action ID. Bounded 4/8/16/32/48 hour retry per original action. No send or email promotion. Original response 160kB, 2 redirects, 2.5s and same-host HTTPS all unchanged.

**Regression:** `tests/brain-public-work-email-firstparty-source-pages-20261114.test.mjs` covers historical retry, 85-company daily slots, bounded backoff, failure taxonomy, source safety and no alternate sender. Original main code/skill/lesson/documentation must be separately promoted via protected GitHub and independently read back from live Edge. Business outcome remains DEGRADED and must not be incorrectly closed.

**Prevention:** Every failed HTTP source fetch leaves a categorical root cause; each later attempt obeys bounded schedule and retry lineage; only verified published named work-mailto can become an UNVERIFIED non-sendable candidate for #138.
