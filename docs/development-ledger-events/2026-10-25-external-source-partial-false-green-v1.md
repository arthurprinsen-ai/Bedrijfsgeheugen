# Source partial false-green delivery regression

- Date: 2026-10-25
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Root: HTTP 207 2-of-3 provider execution still passed true to bg_bewijs, which persists GREEN to brain_delivery_evidence
- Live evidence: request 12523, 2026-10-25 10:12 UTC, task code 40101, valid results for other two topics
- Fix: one sourceBatchEvidenceVerdict per actual results, green only when every requested topic succeeded
- Negative replay: 2-of-3, 0-of-3 and empty batches fail RED; 3-of-3 GREEN
- No new cron, owner, queue, sender, prospect, paid order, provider request or bypass
- Status: CANDIDATE; protected CI, Edge deploy and real provider/Brain readback pending
