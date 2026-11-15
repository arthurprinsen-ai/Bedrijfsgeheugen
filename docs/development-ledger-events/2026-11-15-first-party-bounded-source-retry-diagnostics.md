# 2026-11-15 — original first-party HTML no-reason repeated failed source investigation

- P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Actual native observation: Edge v101, first-party 187 domains with eight-slot daily rotation, 10 original `SOURCE_HTML_UNAVAILABLE` source obligations, 8 due, latest 18:07 UTC natural original worker retried 2, both failed. 605 pre-existing canonical emails of 23,295 contacts, four original commercial handoffs not yet proven.
- Actual code deficiency: original safe `readBoundedPublicPage` suppressed upstream HTTP/timeout/redirect/body diagnoses and scheduled the same 4h interval even after repeated failures, preventing reason-specific repair and wasting bounded source slots.
- Source-preserving fix: explicit bounded non-PII diagnostic codes, no URL/credentials/body/person in the codes; bounded original action retry policy 4/12/24/48 hours; assign existing original owner safe alternate source at five attempts. Preserve original research/action IDs, opt-out, send suppressions, same-company HTTPS redirects, 160kB and 2.5s, no new worker or provider and no promoted addresses.
- Regression: tests/brain-public-work-email-firstparty-source-pages-20261114.test.mjs, exact source/CI/CodeQL/Edge native production readback. No source-result claim before next real due original execution. All failures in same BRAIN occurrence/fingerprint and original P0. Status: CANDIDATE until protected release + independent readback, not live.

## Protected admission failure and repair on same original candidate (15 Nov 18:22 UTC)

- Actual CI: Required run `43746353231` / hygiene admission failed `LEARNING_CANONICALIZATION_FAILED: LEARNING_EVALUATION_FAILED:historical_replay:exit_1`. The existing static test still asserted literal `readBoundedPublicPage(homeUrl)`, while the correct implementation now passes an extra bounded non-PII diagnostic sink parameter. Other six source regression cases passed, including the new retry helper.
- Correction: update the original regression assertion to accept either old or new optional diagnostic argument, while preserving its actual HTTPS/same-host/size, no-send and bounded retry safety assertions. This fixes an outdated test expectation, NOT a production check bypass. Re-run exact-head admission, backend, CodeQL and original native Edge production readback.
