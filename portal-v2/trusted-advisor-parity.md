# Portal V2 trusted-advisor parity v1

## Canonical obligation
Every customer-editable datum from the protected legacy portal inventory must exist in Portal V2, persist tenant-scoped through the existing Portal Domain State and business-input write path, and remain consumable by Powerhouse Intelligence. No parallel store is introduced.

## Model fidelity
Strategic frameworks are rendered as their actual framework rather than as a generic form carrying the framework name. BCG is a BCG matrix; Business Model Canvas, Value Proposition Canvas, Lean Canvas and every other protected model preserve their native dimensions, axes, cells, relationships and completion semantics. Empty customer fields remain visibly empty.

## Truth contract
Every model field has an explicit state: answered, not_answered, not_asked, not_applicable, derived, or insufficient_evidence. Customer input, imported/source evidence and Powerhouse derivation are different provenance classes. A derived hypothesis must never be persisted as if the customer answered it.

## Intelligence contract
Saved inputs carry truthContract=powerhouse-model-truth-v1, preserveMissing=true and intelligenceEligible=true. Powerhouse Intelligence may combine customer evidence, source evidence and explicitly labelled derivations to produce findings, contradictions, risks, opportunities, recommendations and roadmap actions. Missing data may create a question or evidence gap, never a fabricated business fact.

## Legacy parity authority
portal-v2/legacy-functional-inventory.js remains the protected baseline: all 24 capabilities, their fields, models, calculations, actions, dependencies and global capabilities must remain represented in V2. Parity means save/reopen plus semantic model fidelity, not merely route presence.

## Acceptance
For every protected legacy page: filled, partially filled and empty customer states must survive save/reopen; conditional questions must preserve not_asked/not_applicable; calculations must consume only eligible evidence; Powerhouse advice must retain model/field provenance; no demo/local-only state may be presented as durable customer truth.
