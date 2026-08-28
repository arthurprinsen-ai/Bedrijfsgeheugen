# Brain Context Contract

The Context Compiler provides the smallest mission-relevant package. It never dumps unrestricted history into workers.

Truth precedence is `VERIFIED > SUPPORTED > INFERRED > HYPOTHESIS > CONTESTED > STALE > INVALID`. A lower-authority item never overwrites verified Current State. Contradicted/stale evidence remains visible with reduced effective confidence. Invalid records are excluded from active decision context.

Every context package includes mission identity/objective/targets, `why_now`, relevant facts/evidence/patterns/current state/failures, immutable hard-boundary constraints, protected metrics, budget and rollback. Entity filtering is mandatory unless an item is explicitly global.
