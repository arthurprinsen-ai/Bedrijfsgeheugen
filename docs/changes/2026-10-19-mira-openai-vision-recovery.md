# Mira exact-media verification recovery
Obligation-ID: mira-openai-exact-media-verification-20261019
Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

A real new five-second OpenArt video reached the canonical router in request 8005. Its start-frame verification returned VISION_PROVIDER_REQUEST_FAILED; no identity verdict was produced. Both image and temporal verifiers still used Anthropic despite the user authorizing migration to OpenAI. This is distinct from media generation and LinkedIn read permissions.

The existing verifiers now share a strict OpenAI Responses transport, retaining their exact original images, structured verdicts, identity comparison and conservative acceptance thresholds. Requests use store=false; only fictional canonical Mira images are in scope. The governance migration changes the existing use case, preserving its approval and data boundaries. No new sender, queue, scheduler or provider fallback exists.

Tests first failed for the absent transport, then passed for exact image/schema delivery, typed verdicts, incomplete output, wrong tool and provider errors. Runtime proof must still be collected after protected merge and Supabase Integration deployment. Reuse history 4ZzixkZHJvVUR6Z2wHk8 in job 53a1ef96-56ce-4174-a1a3-cfa500f9d7c2; no new generation. No public Instagram publication is claimed.

Rollback restores both source verifiers and the previous scoped governance provider together; never change one side alone or relax proof gates.

The broader identity suite exposed a pre-existing stale error-name assertion for image2video, while the router already permits canonical element2video. The assertion now names the current reference-validation error; all rejection ordering and real identity checks remain enforced.

Broader comparison: unchanged main ran 105 tests (82 passed, 23 failed); candidate ran 107 (85 passed, 22 inherited failures). Focused exact-image/temporal/face suite: 9 passed, zero failures. Inherited failures include contradictory legacy Meta/Composio transport assertions and stale source-pattern names; their names are retained in the Brain record. No whole-system test success is claimed.
