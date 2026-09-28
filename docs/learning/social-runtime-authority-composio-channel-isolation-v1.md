# Social provider authority and capability isolation

## Problem
The repository authority still described Buffer as the social delivery runtime although Buffer is retired. This made repository governance disagree with the actual Composio path and encouraged global provider readiness semantics.

## Canonical rule
Social delivery is owned by `powerhouse-social-publisher` using Supabase + Composio. Each channel is independent: LinkedIn personal validates the personal identity and exact account; LinkedIn company additionally requires organization capability; Instagram validates the canonical `bedrijfsgeheugen.nl` identity and Mira final-media proof.

A missing capability blocks only that channel. It must never suppress unrelated publishable channels. ACTIVE connection metadata is not delivery evidence. Terminal success requires the external provider identifier/URL and provider/live readback.

## Recovery
Resume the same `runtime_authority_reconciliation` obligation. Do not create a second publisher, re-enable Buffer/Make, weaken Mira gates, or repeatedly reauthenticate an OAuth config that does not request the required scope.
