# Skill — Instagram Mira Visible Identity Gate v1

Parent learning: `metadata-only-mira-identity-false-positive-v1`  
Authority: Powerhouse Brain/Supabase + protected GitHub  
Applies to: every chat, agent or workflow that generates, reviews, publishes, recovers or republishes Mira Instagram media.

## Trigger

Use this skill whenever the target channel is Instagram and the content identity is Mira.

## Procedure

1. Read the existing publication obligation, decision, artifact and exact-media proof first.
2. Bind the exact final media URL and immutable SHA before dispatch.
3. Inspect the exact final pixels/frames with semantic vision verification.
4. Require visible Mira proof: `verified=true`, `semantic_verified=true`, `mira_present=true`, `identity_class=mira_daily_life`, `evidence_method=vision`, plus at least one `vision:*` evidence reference.
5. Require exact format: static feed 1080x1350; reel/video 1080x1920.
6. For reel/video, verify start, middle and end frames independently.
7. Fail closed on missing, stale, mismatched or metadata-only evidence.
8. Revalidate inside the publisher immediately before provider dispatch.
9. After release, run negative production probes for metadata-only identity and wrong dimensions.
10. Persist outcome, root cause, evidence and prevention back to the canonical Brain learning record.

## Forbidden shortcuts

Never treat any of these as identity proof: template name, layer name, filename, prompt text, provider `sent` status, caller `mira_gate_passed=true`, asset URL alone, or a prior successful post.

Never regenerate, duplicate or republish a blocked incident artifact solely to make a daily run green.

## Success condition

Success is only valid when exact final media passes the semantic identity + dimension gate and production readback proves known-invalid inputs are blocked. Otherwise the state remains blocked/recoverable.
