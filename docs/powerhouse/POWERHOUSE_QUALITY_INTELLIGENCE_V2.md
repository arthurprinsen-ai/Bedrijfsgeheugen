# Powerhouse Quality Intelligence v2

Fingerprint: `powerhouse-quality-intelligence-v2`

v2 extends, and never replaces, `powerhouse-quality-intelligence-v1`. v1 plus BRAIN-DELIVERY-v2 and Powerhouse Assurance remain deterministic release authorities.

## Operating model

v2 discovers quality blind spots, runs bounded exploratory/adversarial sensors, evaluates production shadow observations, and optimizes test placement. AI output is always candidate/advisory until deterministically reproduced. Required `UNKNOWN` or `NOT_REGISTERED` evidence blocks; it is never converted to green.

### Coverage Intelligence
`config/powerhouse-quality-surfaces.json` registers canonical surfaces. `buildCoverageReport` compares registered evidence and emits explicit gaps. Optional unregistered targets remain unknown rather than falsely proven.

### Exploration
`exploration-policy.mjs` prohibits destructive production actions and bounds page/action/time budgets. Semantic/AI visual findings are candidate findings and cannot become release evidence without deterministic reproduction.

### Adversarial testing
`powerhouse-quality-adversarial-matrix.json` declares safe targets for idempotency/order, identity, tenant boundary/IDOR/BOLA, unexpected fields, abuse boundaries and provider partial failure. Destructive production chaos is forbidden.

### Production shadow
Safe read/synthetic observations compare expected and observed contracts. Drift becomes an escaped-defect obligation using `BRAIN-CLOSED-LOOP-v1` and BG169 lineage; no second datastore is created.

### Test economics
Risk always dominates cost. Critical/high and unknown tests stay required. Only known low-risk, expensive, low-yield tests can move to scheduled execution. The economics layer can never waive a red gate or delete critical tests.

### Provenance/SBOM
Exact-SHA artifact provenance and SBOM are required where the release actually produces an eligible artifact and platform support is registered. Unsupported/unregistered paths remain explicit obligations; they are never inferred green.

## Learning
The canonical loop is CHANGE → IMPACT → TEST → ATTACK → EXPLORE → VERIFY → PROMOTE → PROD_READBACK/SHADOW → ESCAPED DEFECT → ROOT CAUSE → REGRESSION → TEST VALUE → LEARN → SCOUT → BENCHMARK → ADOPT/REJECT. External innovations reuse the existing state-of-the-art adoption authority and never auto-adopt.
