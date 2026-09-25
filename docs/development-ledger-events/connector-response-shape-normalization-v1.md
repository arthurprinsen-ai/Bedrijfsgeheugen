# Connector response-shape normalization v1

Date: 2026-09-25

Fingerprint: `connector|response-shape|normalize-before-use|v1`

A bundled GitHub tree write failed before branch mutation because the connector response did not place the created tree SHA in the caller's expected field.

Root cause: transport-envelope coupling. The caller assumed one connector payload shape instead of resolving the required semantic tree identity through a normalization layer.

Permanent prevention:
- normalize connector responses before chained mutations;
- validate SHA/ref/id before the next side effect;
- fail closed before branch/ref mutation when identity is absent;
- fall back to same-branch serial Contents API writes when a bundled tree response cannot be normalized;
- never create a duplicate PR solely to recover from response-shape drift;
- read back commit and branch identity after every recovery write.

This event is represented in Brain learning and projected into the connector-response normalization skill.
