# Canonical source-backed publisher retry on blocked content — P0 #4198

## Incident
10 Oct content decisions existed, but both LinkedIn lanes were blocked by the global exact/story-family uniqueness control, and the existing supervisor only invoked the orchestrator for `state=decided` rows. After source selection was corrected, the content loop reported no eligible artifact and could not recover by itself. A blog item referencing the already closed Circular Plastics NL application was quarantined before delivery.

## Implementation
Reuse the existing `powerhouse-content-orchestrator` inside `powerhouse-content-loop` and its lease, once per supervisor tick, when a `publish` decision is `blocked` for `GLOBAL_POST_DUPLICATE_BLOCKED:...` or `SOURCE_DEADLINE_EXPIRED`, and **only** when there is no provider ID, no create/ack/readback proof, no possible side effect and no republish prohibition. Invoke current recommendation materialization; never disable unique-publication, identity, media, provider or human-consent gates. Existing content generation has a maximum of four bounded rounds.

Current state is not claimed to be live. Provider-delivered posts/Instagram/blog and actual commercial revenue require independent readbacks. Owner remains P0 #4198.
