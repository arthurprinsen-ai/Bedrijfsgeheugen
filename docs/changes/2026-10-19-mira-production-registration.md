# Exact Mira production-stage registration
Obligation-ID: mira-production-stage-registration-20261019
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

After protected merge #4492, OpenAI governance applied but a real same-video request 8015 still returned AI_GOVERNANCE_UNAVAILABLE. Provider metadata confirmed the image verifier remained v12 with old Anthropic source. The apparently successful production authority attested 21 other registered functions: the three media stages were absent from supabase/config.toml. The shared-helper scope resolver returned only declared slugs before considering explicit function edits, hiding the missing registrations.

Register the existing router/image/temporal stages with their existing custom-token authentication. Resolve shared impact as the union of declared functions and explicitly edited functions; existing production authority rejects any undeclared member. No second deployer, direct production source deployment or weakened gate is introduced.

Two focused tests failed before the fix: explicit undeclared function disappeared under shared scope, and existing Mira stages were not production-registered. Existing direct/config scope tests remain required. Production acceptance requires Supabase Integration plus exact source parity for all three stages and independent proof of the already-generated video. Reuse history 4ZzixkZHJvVUR6Z2wHk8; no regeneration or provider publication before proof.
