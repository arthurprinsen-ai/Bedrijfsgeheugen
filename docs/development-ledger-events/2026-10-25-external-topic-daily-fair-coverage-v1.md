# Market-signal daily rotation recovery

2026-10-25: Existing three-topic external collector clock-aliases with a fixed daily schedule and 44 topics. Three topics have no stored records and six are older than a week. Rotate by UTC day and 20-minute window without additional schedule, queue or provider requests per run. Keep exact source provenance and all evidence gates. Test: tests/brain-external-topic-rotation-v1.test.mjs. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Delivery remains CANDIDATE until CI, protected merge, Edge deploy and real source readback.
