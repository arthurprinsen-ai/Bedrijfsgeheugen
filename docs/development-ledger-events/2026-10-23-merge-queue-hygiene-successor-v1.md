# Development ledger — provider SHA checkout guard after duplicate resolution
Date: 2026-10-23
Obligation: delivery|merge-queue|hygiene-exact-sha-and-organization-cutover|20261023-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Earlier implementation #4782 was closed without merge: main #4783 already landed stricter merge-group fail-closed authority. Avoid overlapping stale PR/source replacement.
Current source authority: #4783 on main `9844fea635248f534d4e0fb8ad3b517f3ad653d5` requires `MERGE_GROUP_ADMISSION_PROOF_REQUIRED` pending genuine aggregate PR lineage. This new candidate ONLY adds independent `GITHUB_SHA`/checkout/merge_group.head_sha equality check in reusable hygiene.
Tests: tests/brain-merge-group-hygiene-checkout-sha-v1.test.mjs; Brain canonical historical replay/shadow/canary. No production release. Netlify current published baseline ad01555f, Supabase ACTIVE_HEALTHY, observed not proof of this candidate.
Hard boundary: GitHub org selection and authorized transfer, apps/Netlify/Supabase reconnect and native queue configuration remain pending. No green/live claim.
