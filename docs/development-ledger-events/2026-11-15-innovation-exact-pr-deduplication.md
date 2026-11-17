# Original engineering PR false-duplicate incident and fix

- Date: 2026-11-15
- Failure run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43753665119
- Native original candidate: 7ae7a817-5900-41df-bf7c-d127e8336b13
- Evidence: source-bound selector returned selected=false despite 14 OPEN originals because generic PR-body search saw the original ID mentioned in recovery PR #5904
- Root cause: `pr.body.includes(id)` conflated a recovery/documentation reference with a genuine protected engineering implementation
- Fix: exact GitHub implementation branch plus type, source SHA, revision, original operation and canonical agent owner
- Regression: tests/brain-innovation-original-code-delivery-20261115.test.mjs
- Mid-patch error caught before PR: JavaScript replacement template `$'` changed the patch. Reconstructed from untouched protected main with a callback replacement and independent branch readback. Never use replacement string interpolation for source text containing `$'`; use callback to preserve literal bytes.
- Business end state: 14 INNOVATION_DELIVERY still OPEN, no consumer implementation ACK or measured effect claimed, no second scheduler created
- Next independent evidence: protected merge, existing original_code_recovery replay, native original source-readback, then Heartbeat effect outcome
