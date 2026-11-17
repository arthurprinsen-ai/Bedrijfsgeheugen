# 2026-11-15 — original source-rotation conflict resurrection

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: powerhouse|linkedin|observational-source-conflict-resurrection|20261115-v1
- Original owner: Powerhouse radar + public.powerhouse_ensure_personal_source_rotation_v2(date)
- Reproduction: original signal 0deb2bad-4ad1-459f-bffa-ca30584bb226, original recommendation 6418326b-bded-487d-b1dd-1ec22ea0af66. Same-date source rotation returned observational_personal_theme_created, despite recommendation previously skipped, rewrote 627-character corrected source to 143-character abbreviated original.
- Containment: original signal eligible=false (with quarantine evidence), recommendation status=skipped, original personal publication obligation OPEN, no provider ID.
- Permanent rule: >=240 source characters, nontruncated dated HTTPS original source, no quarantined signals; source identity by dedupe key + URL; ON CONFLICT DO NOTHING with row-count receipt, original privilege retained.
- Regression: tests/brain-personal-observation-rotation-no-resurrection-20261115.test.mjs
- Outstanding verification: Required/CodeQL, native protected migration ledger and exact source readback, real original provider post, named ONE BRAIN PROCESSED and Heartbeat metric result.
