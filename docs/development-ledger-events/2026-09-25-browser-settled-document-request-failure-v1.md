# Development ledger — settled document request failure v1

Date: 2026-09-25  
Obligation: `governance-production-trigger-ownership-v1`  
Fingerprint: `delivery|browser-verifier|settled-document-request-failure|v1`

## Evidence
PR #3098 Required run 36172823328, browser job 108197088155: homepage desktop preview was HTTP 200, canonical/title correct, visible content present, pageErrors empty, but failedAssets contained only `document:/`.

## Change
The targeted route verifier filters that exact settled document failure only after successful final navigation. Script/stylesheet failures and unsuccessful document navigation remain fail-closed.

## Verification
Two regression cases prove the safe boundary: successful final document navigation filters the duplicate document failure while preserving script failure; absent HTTP success preserves the document failure.
