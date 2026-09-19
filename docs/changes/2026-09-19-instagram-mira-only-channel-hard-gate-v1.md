# Instagram Mira-only channel hard gate

This change makes the Bedrijfsgeheugen Instagram channel semantically Mira-only.

## What changed

Every Instagram publication must now prove all of the following before scheduling or publishing:

- the artifact is explicitly assigned to `contentPersona=mira`;
- the content class is `mira_daily_life`;
- the exact final visual proves `miraPresent=true`;
- the creative is not generic Bedrijfsgeheugen brand content.

Generic brand cards, quote cards, blog promos, LinkedIn creatives and other non-Mira content are blocked fail-closed even if the media file itself is technically valid.

## Root cause

The previous gate was strong on media integrity and identity metadata, but it did not separately require an explicit Mira persona assignment and visible-Mira proof. That left a semantic escape where generic company creative could pass transport-oriented validation.

## Prevention

The channel contract, runtime identity gate and delivery-source selection now all enforce the same Mira-only rule. Regression tests cover non-Mira persona, generic brand creative, missing visible Mira, and valid exact Mira media.

## Verification

Required validation includes Buffer Social Learning, Required test, BRAIN delivery, Powerhouse CodeQL and exact-head protected merge before the change can be treated as live.

Obligation: `instagram-mira-only-channel-hard-gate-v1`  
Fingerprint: `instagram-mira-only-channel-hard-gate-v1`
