# 2026-10-06 — Supabase Edge single-writer byte-readback authority v3

Date: 2026-10-06
Obligation-ID: supabase-edge-single-writer-byte-readback-20261006-v1
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: e6e676c670127b7378143688b684f6ef8ba6294f

Observed:
- protected merge `c868595e92ba5fa290de1dfb1eed632ec344802f` produced successful Supabase App check `112287139805`;
- authority attestation job `112286822569` completed successfully;
- direct provider readback still showed `social-recovery-runner` version 7 with old source;
- provider source length was 10259 bytes while protected-main source was 11458 bytes;
- the Supabase check output carried no source identity.

Repair:
- demote Supabase GitHub App check to advisory;
- restore exactly one normal writer: protected-main GitHub Actions with pinned Supabase CLI;
- require `SUPABASE_ACCESS_TOKEN`, preferring project-scoped Edge Functions Read-write;
- deploy only the resolved protected-main function set;
- couple publisher + recovery-runner;
- download every deployed function and compare the complete file tree byte-for-byte;
- fail closed on any runtime epoch change or provider drift.

Human bootstrap still required:
- create one Supabase PAT;
- add it to the GitHub production environment as `SUPABASE_ACCESS_TOKEN`;
- do not paste the token into chat.

Terminal criteria:
exact-HEAD gates -> protected merge -> bootstrap credential present -> protected-main social-pair promotion -> byte-for-byte Supabase readback -> canonical social recovery -> provider truth readback.
