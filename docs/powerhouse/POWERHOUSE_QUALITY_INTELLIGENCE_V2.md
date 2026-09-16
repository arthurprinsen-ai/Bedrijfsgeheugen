# Powerhouse Quality Intelligence v2

Fingerprint: `powerhouse-quality-intelligence-v2`

v2 extends, and never replaces, `powerhouse-quality-intelligence-v1`. v1 plus BRAIN-DELIVERY-v2 and Powerhouse Assurance remain deterministic release authorities.

## Operating model

v2 discovers quality blind spots, runs bounded exploratory/adversarial sensors, evaluates production shadow observations, and optimizes test placement. AI output is always candidate/advisory until deterministically reproduced. Required `UNKNOWN` or `NOT_REGISTERED` evidence blocks; it is never converted to green.

## Canonical implementation

- `powerhouse/assurance/quality-intelligence-v2.json` — machine contract and authority boundaries.
- `scripts/brain/quality/quality-v2-core.mjs` — one v2 module exporting deterministic sensors.
- `coverage-intelligence.mjs` — registered-surface/evidence gap analysis.
- `exploration-policy.mjs` — bounded safe exploration and advisory finding normalization.
- `production-shadow.mjs` — safe observation drift → escaped-defect obligation.
- `test-economics.mjs` — risk-first lane placement; no gate waiver.
- `config/powerhouse-quality-surfaces.json` — canonical surface projection.
- `config/powerhouse-quality-adversarial-matrix.json` — safe adversarial/state cases.
- `quality-intelligence-v2-release.json` — candidate/release truth contract and open obligations.

## Deep sensor truth

Autonomous browser exploration, semantic visual AI, stateful/chaos execution, adversarial target execution, provenance/SBOM and experimental profiling are capabilities with explicit evidence requirements. Their contract/configuration does **not** mean they have executed successfully. They become proven only from their own exact-target run evidence.

## Coverage Intelligence
Registered required surfaces without proven evidence become gaps. Optional/unregistered API and integration targets stay unknown/NOT_REGISTERED and are never reported green.

## Exploration
Destructive production mutations are prohibited. Semantic/AI visual findings remain candidate findings and cannot become release evidence without deterministic reproduction.

## Adversarial testing
Safe targets cover idempotency/order, identity, tenant boundary/IDOR/BOLA, unexpected fields, abuse boundaries and provider partial failure. Production-destructive chaos is forbidden.

## Production shadow
Safe read/synthetic observations compare expected and observed contracts. Drift becomes an escaped-defect obligation using `BRAIN-CLOSED-LOOP-v1` and BG169 lineage; no second datastore is created.

## Test economics
Risk dominates cost. Critical/high and unknown tests stay required. Only known low-risk, expensive, low-yield tests can move to scheduled execution. Economics can never waive a red gate or delete critical tests.

## Provenance/SBOM
Exact-SHA provenance/SBOM is required where an eligible artifact and supported registered platform route exists. Unsupported/unregistered paths remain explicit obligations; they are never inferred green.

## Learning
CHANGE → IMPACT → TEST → ATTACK → EXPLORE → VERIFY → PROMOTE → PROD_READBACK/SHADOW → ESCAPED DEFECT → ROOT CAUSE → REGRESSION → TEST VALUE → LEARN → SCOUT → BENCHMARK → ADOPT/REJECT. External innovations reuse the existing state-of-the-art adoption authority and never auto-adopt.
