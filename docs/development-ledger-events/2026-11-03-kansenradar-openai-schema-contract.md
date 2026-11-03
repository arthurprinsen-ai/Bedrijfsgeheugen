# 2026-11-03 — Original Kansenradar OpenAI function contract incident
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original production request 19898 returned HTTP 500 OPENAI_OUTPUT_CONTRACT_FAILED after OpenAI v13 migration.
- Source cause: a JSON-mode instruction asked for a function-name wrapper instead of original top-level arrays oordelen and berichten.
- Permanent source fix: force original OpenAI named tool with original JSON parameter schema and parse function arguments, rejecting missing malformed or refused output.
- Original continuity skill and Brain learning updated; regression assertions in tests/brain-original-native-generator-radar-provider-20261103.test.mjs.
- Status: protected PR candidate; edge deployment and real provider effect NOT YET VERIFIED. No double publisher or missing-source GREEN.
- The earlier owner OpenAI-only learning record is updated with original request 19898 (source-preserving append), included in explicit seven-file branch scope. Existing original escalation stays attached to issue #4198; exact-head security gates are required to rerun.
