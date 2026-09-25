# Global social-post uniqueness v1

Date: 25 September 2026
Fingerprint: `powerhouse-global-post-uniqueness-v1`

## Incident and evidence

Duplicate prevention previously focused on one daily claim and provider idempotency. That prevents some double writes, but it does not stop old content from being reused on another day.

Production history proves the gap:
- the same Instagram `content_hash` appears on both 14 and 15 September;
- multiple personal LinkedIn artifacts reuse the same printer story across several dates with only light rewriting;
- today the user again observed a duplicate post.

## Permanent rule

Every social post is one-time-use content. Final copy must never have appeared earlier as exact or materially near-identical content, regardless of date, channel or provider.

## Technical enforcement

`powerhouse_publication_uniqueness_v1` is the canonical content reservation ledger.

Before any social provider create:
1. final text is normalized;
2. raw SHA-256 and normalized SHA-256 are checked globally;
3. normalized 3-word shingles are compared with retained historical text;
4. similarity >= 0.62 is blocked;
5. successful uniqueness is atomically reserved under a global advisory lock;
6. duplicate/near-duplicate claims become blocked + republish-forbidden before a provider call.

URLs, punctuation and whitespace are excluded from normalized similarity so superficial formatting cannot bypass the gate.

Historical provider content hashes and published/scheduled Powerhouse artifacts are backfilled into the registry.

## Recovery behavior

A retry of the same canonical daily/channel claim may reuse its own reservation. Another claim may not. If duplicate history is detected, the correct recovery is to generate a genuinely different source, story or angle — never synonym replacement.
