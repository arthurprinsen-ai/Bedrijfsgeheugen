# Development ledger: first-party daily company cohort starvation

- **Fingerprint:** `powerhouse|contacts|first-party-one-slot-rotation-repeats-unreadable-domains|20261115-v1`
- **Original parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- **When observed:** 2026-11-15 UTC; production graph 23,295 contacts, 605 canonical emails, 22,690 missing, 85 known corporate-domain companies with missing-colleague records
- **Observed failure:** existing #116 domain research 8/day shifted 1 domain/day; 10 unreadable source actions stayed on 4h bounded retries with 0 provider-verified new email addresses; overlap wastes source diversity
- **Cause:** modulo on calendar day used as one-slot offset rather than eight-slot cohort stride
- **Fix:** source-only pure offset helper, original #116 existing Edge invocation, persistent original health metrics candidate domains/offset/stride; zero new queue/cron/paid provider/sender
- **Protect:** no personal email addresses in this public ledger; never treat public address or source candidate as consent/deliverability/provider delivery; current BRAIN consumer safe hold remains correct
- **Regression:** tests/brain-public-work-email-firstparty-source-pages-20261114.test.mjs — 85/11 day, distinct first 80, per-day 8 cap, no unauthorized send / scheduler calls
- **Owners:** original #116 research; original #138 identity → ONE BRAIN → Heartbeat/commercial; existing Reliability + Data Quality agents
- **Release status:** PENDING protected gates, merge, native Edge deployment and natural #116 readback. No claim of production repair before evidence
- **Next action:** independently verify native Edge source parity and next original due run; measure new source-verified addresses and the original person/company/revision ACK; preserve all open source and commercial obligations until terminal evidence
