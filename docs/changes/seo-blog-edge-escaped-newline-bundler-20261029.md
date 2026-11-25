# Supabase Edge parser hotfix — daily SEO reservation

Date: 2026-10-29
Status: CANDIDATE_NOT_LIVE

Protected PR #5097 fixed the semantic reservation capacity bug but inadvertently inserted a literal backslash-n between two TypeScript chained calls. Supabase rejected the deployment at index.ts line 102, leaving production version 100 active and safe. This is a release-process defect rather than a reason to weaken the existing auth, privacy, P0 #5072 or Supabase migration #3742 safety gates.

Fix exactly one invalid escaped newline in the same existing resolver and add a regression test that independently checks actual newline bytes. Existing source-only test coverage was insufficient to detect a Deno parse failure. Do not claim LIVE until the provider bundle accepts the new main source and exact file parity and authenticated HTTP 200 are independently observed.
