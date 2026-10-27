# Development ledger event — blog reader evidence — 2026-10-25

- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Related daily obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4848
- Fingerprint: content|blog|generic-focus-malformed-faq-expired-forecast|20261025-v1
- Writer: website recovery branch fix/blog-reader-evidence-20261025-v1; no changes to daily blog PR branch
- Source: tools/site-shell/publish_powerhouse_blog_artifact.py
- Regression: tests/brain-blog-reader-topic-faq-expiry-20261025.test.mjs
- Status: CODE_CANDIDATE; not protected-merged, no live claim
- Negative cases: ungrounded focus topic, invented FAQ, expired forecast opening
- Positive cases: source-authored question, future event, meaningful topic
- Prevention: fail closed; hand source artifact back to existing author for correction, never reroute around CodeQL or Required.
