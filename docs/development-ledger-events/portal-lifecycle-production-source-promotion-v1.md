# Development ledger — portal-lifecycle-production-source-promotion-v1

- Trigger: Portal/Powerhouse lifecycle feature merged but production still identified the previous SHA.
- Reuse-first action: activate the existing Production Source Snapshot transport; no parallel deploy mechanism created.
- Required proof: exact main SHA, ready Netlify production deploy, Portal DOM readback, release readback and skill projection.
- Terminal state: LIVE & BEWEZEN only after all proof is current-main bound.
