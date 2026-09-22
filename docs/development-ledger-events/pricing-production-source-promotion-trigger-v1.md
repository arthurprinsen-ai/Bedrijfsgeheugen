# Development ledger — pricing-production-source-promotion-trigger-v1

- Trigger: merged pricing interaction fix while production remained on the prior SHA.
- Action: activate the canonical Production Source Snapshot push path.
- Required proof: exact main SHA in Netlify production, ready deploy, production release readback, pricing content proof.
- Terminal state: only LIVE & BEWEZEN after exact production identity and functional pricing readback are green.
