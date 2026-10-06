# 2026-10-06 — Supabase Edge API source readback v1

Obligation-ID: supabase-edge-api-readback-20261006-v1
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: e902e07fef8b3411451280072b40f0d0aac24bb8

Observed:
- workflow dispatch authenticated successfully with the new production `SUPABASE_ACCESS_TOKEN`;
- stable Supabase production check succeeded;
- default CLI download then failed on `powerhouse-social-publisher/index.ts` at byte 61 / line 2;
- independent official Supabase source readback showed provider v122 exactly equal to protected main.

Repair:
- force `supabase functions download --use-api`;
- retain scoped read-only PAT semantics;
- retain byte-for-byte fileset/source comparison;
- forbid local ESZIP extraction as terminal parity evidence;
- add regression and canonical contract evidence.

No provider deploy writer is added.
