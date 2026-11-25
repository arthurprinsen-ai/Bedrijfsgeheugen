# Canonical Mira FAILED media proof reconciliation — 22 October 2026

Fingerprint: `mira|failed-obligation-rejected-video-diagnostic-not-reconciled|20261022-v1`. P0 parent [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439). Related successfully merged preflight retention [#4703](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4703).

## Confirmed production incident

The actual OpenArt Veo video `Ge4MhZ3FFAoWREo0TtDJ`, 1080×1920 / 8 seconds, was routed through **the existing** Instagram router using authenticated request `10524`. The exact middle frame failed the existing two-image Mira identity test at **0.930**, below mandatory **0.940**. The video was correctly rejected without an Instagram post. The media job was `WAITING_PROOF`, but the daily publication obligation was already `FAILED`, so `recordMediaProofRejection` did not update the obligation diagnostic because it only handles `BLOCKED`.

A one-time guarded live DATA correction copied the exact rejection from canonical media job to the *existing* FAILED obligation, preserved `FAILED` and `external_id=NULL`, and retained old media evidence. A unique failure occurrence was recorded through the existing `brain_observe_failure` RPC with established fingerprint.

## Durable source correction

- Use the observed status value as part of the CAS when updating a FAILED or BLOCKED publication obligation. Do not change its publication status or provider IDs.
- Append future **new** OpenArt history/frame failures to `brain_failure_registry` through its existing idempotent RPC. Retain the exact rejected score and regression pointer; a repeated rejected generation/frame is one event.
- Report `partial` if the Brain ledger write fails, while preserving the existing rejected job and diagnostic.
- New node tests cover FAILED status, one Brain observation, and partial registry failure.

## Release criteria

Required + CodeQL must pass on the exact head, protected merge must land on `main`, and the active Supabase Edge function must be read back at identical protected source version before this code-level change can be PROVEN. Instagram cannot be `LIVE_PROVEN` until a **different** fully verified video passes exact master / start / middle / end >=0.940 + temporal checks plus external provider ID and independent readback. No second scheduler, bypass or duplicate post.
