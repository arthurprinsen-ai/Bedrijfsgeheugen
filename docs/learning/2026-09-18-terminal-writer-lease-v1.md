# Terminal writer lease — 2026-09-18

Powerhouse gebruikt tijdens TERMINAL_DELIVERY één writer per obligation en canonical PR. De lease wordt vóór iedere materiële repository-write via de verplichte chat-learning preflight gelezen.

Als een andere execution node eigenaar is, is de enige geldige actie DEFER: geen commit, geen append-edit, geen parallelle recovery-PR. De lease blijft actief tot protected merge, productie/provider-readback en learning/prevention-writeback zijn afgerond.

Head-drift onder een actieve lease is een control-plane incident en wordt fail-closed behandeld.

Fingerprint: `delivery|same-lineage|parallel-writer-head-thrash-v1`.
