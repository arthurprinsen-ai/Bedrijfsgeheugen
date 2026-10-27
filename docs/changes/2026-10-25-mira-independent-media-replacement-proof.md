# Mira: close the rejected-media proof admission deadlock — 2026-10-25

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439

Observed production: one frozen externally sourced daily-life parking-app winner. The authorized original 8-second OpenArt video `qAUQW2ZzqdasS0ePb1PD` fails canonical Mira start-frame identity at 0.920, below 0.940; post and exact proof remain BLOCKED. A previously completed replacement video `a6sdR46HDe58uRlardNl` has OpenArt generation/format provenance, **not** independent frame/temporal proof. Original frozen winner source, scene and caption cannot be swapped to escape the failure.

## Root cause

`mira-frozen-winner-contract.mjs` pins one original history/URL as if an editorial source and a video quality result were the same immutable object. Thus the existing router rejected every other OpenArt MP4 *before* real frame checking. The Heartbeat retry correctly excludes known identity-mismatch rejects from transient same-file retries, but the combination creates a deterministic permanent wait.

## Corrective boundary

The same original media router admits one *different* candidate only if an independently recorded visual mismatch already exists on the original job, the frozen winner/scene remain identical, its original official Mira master and original OpenArt project are unchanged, and no provider side effect exists. Admission is **not approval**. The original hash, true three-frame face >=0.940 and temporal proof are still mandatory. Only after `PROOF_VERIFIED` is stored in the same canonical job, the original orchestrator may use its media history/URL. The frozen source hash/caption never change; exact-media publisher proof, capability and provider readback remain mandatory.

No new provider spend, AI generation, scheduler, queue, model, consent bypass, rate-limit bypass or duplicate sender was started by this PR. Current state stays blocked until a real candidate independently passes. Production promotion requires Required+CodeQL, appropriate native Supabase preview, protected merge and deployed source/readback. Subsequent use of the already-completed candidate must go through the authorized original owner's scheduler token and canonical verifier, not an alternative sender.

## LinkedIn is a separate auth/readback lane

The October 25 company post is independently LIVE_PROVEN. Personal author post has a provider-create ACK and ID `urn:li:share:7520059104178925568` but its readback returns 403. Canonical personal OAuth token returned `401 REVOKED_ACCESS_TOKEN` on direct API check; an alternative active account identifies a *different person URN* and is **not** an authorized identity substitution. Never resend Oct 25; recover exact canonical author only through approved OAuth/consent, and preserve other channels.

## Verification

`node --test tests/brain-mira-verified-replacement-after-identity-failure-20261025.test.mjs`
Canonical learning: `brain/learning/2026-10-25-mira-verified-source-replacement-after-face-rejection-v1.json`
Terminal success: real same-source candidate independent media proof + provider Instagram ID and readback. Code-only PR does not equal terminal publication.
