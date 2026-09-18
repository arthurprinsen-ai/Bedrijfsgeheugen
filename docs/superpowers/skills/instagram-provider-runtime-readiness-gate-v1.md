# Skill — Instagram Provider Runtime Readiness Gate v1

Fingerprint: `instagram-provider-runtime-readiness-gate-v1`  
Authority: Powerhouse Brain/Supabase + protected GitHub  
Parent learnings: `instagram-media-provider-routing-preproof-v1`, `instagram-chat-tool-boundary-not-db-outage-v1`

## Trigger

Use this skill before any Instagram image, carousel, reel or video generation, recovery, scheduling or publishing action.

## Readiness model

Never use one global provider-connected flag. Resolve these execution planes independently:

- `chat_mcp` — current chat/agent can call the provider.
- `external_worker` — bounded worker can claim and execute the canonical media job.
- `supabase_runtime` — autonomous runtime has authenticated provider execution or a verified worker bridge.
- `publisher` — canonical publisher can consume a proof-verified immutable asset.

## Procedure

1. Read the existing media job, obligation, artifact, provider policy and proof state first.
2. Infer post type before provider choice.
3. Apply provider policy: reel/video = OpenArt only; static image = OpenArt or Placid; carousel video slides = OpenArt, image slides = OpenArt or Placid.
4. Resolve provider readiness for the actual execution plane.
5. If the required producer path is not ready, write `WAITING_PROVIDER_CONNECTION` and stop before provider or publisher side effects.
6. Claim the canonical job before external provider work.
7. Persist provider/model/history/generation identity immediately.
8. Submit only exact provider output to the canonical router.
9. Require immutable SHA, exact dimensions and semantic Mira vision proof.
10. Advance only to `PROOF_VERIFIED`; publisher may never infer proof.
11. After provider dispatch, reconcile provider truth and semantic quality separately.
12. If transport is sent but semantic identity fails, mark quality failure and forbid duplicate republish.
13. Write outcome, root cause and prevention back to Brain/social learning and update this skill when the contract changes.

## Forbidden shortcuts

- Never mark `supabase_runtime` ready because `chat_mcp` works.
- Never insert a fake active provider integration.
- Never treat a prompt, filename, template layer, provider status or prior post as media proof.
- Never replace an OpenArt-required reel/video with Placid.
- Never regenerate a claimed job merely because a chat stopped.
- Never publish while provider readiness or exact-media proof is unknown.

## Success condition

Success requires all of the following:
- actual execution-plane provider readiness proven;
- one canonical claimed job;
- exact provider asset persisted;
- exact SHA/dimensions/semantic identity verified;
- status `PROOF_VERIFIED` before publisher dispatch;
- provider/public readback after dispatch;
- outcome and learning written back.
