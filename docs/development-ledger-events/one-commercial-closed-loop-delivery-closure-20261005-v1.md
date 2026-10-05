# One commercial closed loop — delivery and provider closure evidence

Date: 2026-10-05  
PR: #3739  
Obligation: `one-commercial-closed-loop-v2`

## Events

The exact-head Required test correctly failed closed with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE` because the material R4 Supabase candidate initially lacked repository closure artifacts.

Separately, a LinkedIn provider call returned HTTP 200 while the semantic response was `CONCRETE_POST_CONTEXT_REQUIRED`. The action correctly remained nonterminal and provider acknowledgement stayed 0.

## Structural correction

The candidate now carries all three repository closure surfaces alongside the runtime migration and keeps the provider boundary fail-closed.

Provider execution requires current source context, consent/capability eligibility, pressure/cooldown eligibility, dedupe proof, exact-message-hash quality proof, semantic provider acknowledgement and terminal outcome/readback. HTTP status alone cannot mark an action done.

Heavy identity, research and learning work remains bounded or independently scheduled so it cannot block the canonical heartbeat. No-response remains observation-only learning evidence.

## Terminal invariant

`runtime change → repository closure evidence → exact-HEAD full checkset → merge → production readback → terminal closure`

and, for external outreach:

`candidate → context/source → consent/pressure/dedupe → exact message proof → provider semantic ack → terminal outcome → attribution → learning`

No merge or LIVE_BEWEZEN claim is permitted before the relevant chain is complete.
## Required-check trigger closure

The candidate exposed a CI deadlock: branch protection requires `CodeQL javascript-typescript`, while the Powerhouse CodeQL PR trigger previously excluded SQL/documentation-only changes. The PR trigger is now unconditional for main-targeting pull requests, so every candidate can emit the required check. Main-push path filtering remains unchanged.

