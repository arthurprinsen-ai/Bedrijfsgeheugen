# Main-wide promotion slot — shadow phase

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Obligation: delivery|main-wide-promotion-slot|20261124-v1

The existing supervisor observes complete native main PR pages and auto-merge requests and evaluates a pure single-slot transition model. Exact candidate, owner, obligation, current epoch, provider check identity, ledger revision and verified revocation before transfer are modeled. 53/53 isolated regressions passed. No provider write, permission change, new scheduler or drift reset. Exclusive app authority is not proven (403). Shadow is not enforcement. Next phase requires independently authenticated exclusive writer, atomic grant ledger and native required-context enforcement, then bounded recovery by original owners. #6142/#6165 must not be synced based on this shadow proposal. Protected CI and scheduled execution readback remain mandatory.
