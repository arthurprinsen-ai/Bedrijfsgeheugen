# P0 #4198 — canonieke JSON-bewijzen bij kanaalbeslissingen

## Root cause
Today the production `powerhouse_channel_decisions.delivery_evidence` JSONB column contained mixed object/string types. Some rows held a JSON **string** (a serialized object), not a JSON object. When the publication generator read `generation_retry_after` via object navigation, the value was invisible and an editorially rejected personal LinkedIn draft could repeatedly monopolize the generator.

## One canonical repair
A narrow trigger on the existing table converts only valid, double-encoded object strings to JSONB objects. Invalid shapes fail closed instead of being treated as provider proof. A bounded migration repairs the last 14 days of safely decodable evidence. No new executor, owner role, publication authority, provider claim, or social message is created.

## Production validation
Verify after protected merge: trigger exists and is enabled; recent decisions have object-typed `delivery_evidence`; a synthetic database transaction that rolls back demonstrates legacy string-to-object conversion; existing provider receipts, states and priorities unchanged. Repeat generation should select another due channel during a personal generation cooldown.

Regression: `tests/brain-decision-evidence-normalization.test.mjs`. Parent: #4198. The absence of an external publication ID still prevents a LIVE_PROVEN conclusion.
