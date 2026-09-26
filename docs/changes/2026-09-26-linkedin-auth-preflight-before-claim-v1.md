# LinkedIn auth preflight before publication claim — 2026-09-26

## Incident

The social chain could show a Composio LinkedIn connection as ACTIVE while the actual LinkedIn token was revoked. On 2026-09-26 all three observed LinkedIn connections returned HTTP 401 `REVOKED_ACCESS_TOKEN` on a real provider read. Buffer was independently unavailable with HTTP 429 and a multi-day Retry-After, so Buffer is not a recovery transport.

The canonical publisher performed its atomic daily claim and publication-capability consumption before proving provider authentication. A pure authentication failure could therefore strand an otherwise valid daily publication in a blocked state even though no external write had occurred.

## Permanent rule

Provider authentication is now a prerequisite to the publication transaction. A minimal authenticated LinkedIn read must pass before the decision may leave `content_ready`. Reauthorization failures remain resumable and consume no publish capability. Once a create succeeds and a LinkedIn URN exists, the system switches to the opposite safety mode: republish is forbidden and recovery is exact-URN reconciliation only.

## Current-day safety

The 2026-09-26 company LinkedIn claim already has `urn:li:share:7509384024180686848`. That object is preserved; no replacement publication is authorized. Personal LinkedIn remains gated by verified personal truth. Instagram remains Mira Reel-only and requires exact final-media proof before publication.

## Regression

`tests/brain-linkedin-auth-preflight-resumable-v1.test.mjs` verifies ordering, resumable auth failure state and post-create replacement prohibition.
