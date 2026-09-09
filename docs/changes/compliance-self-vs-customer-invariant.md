# Compliance Command Center — self vs customer invariant

Status: canonical
Owner: Trust & Governance
Applies to: `portal-next/compliance.html`, `portal-next/compliance-command-center.js`, `portal-next/compliance-input-adapter.js`, `portal-next/bedrijfsgeheugen-compliance-evidence.js` and related tests.

## Invariant

`Bedrijfsgeheugen` and `Uw organisatie` are two different compliance projections and must never collapse into the same data source, state or presentation.

### Bedrijfsgeheugen

The `Bedrijfsgeheugen` scope must show Bedrijfsgeheugen's own current controls, technical safeguards, evidence, verification timestamps, risks, gaps and next actions.

Rules:
- Existing Bedrijfsgeheugen controls and evidence remain visible even when legal applicability for a framework is still `unknown`.
- Legal applicability may be decided per control; one framework-wide conclusion must not overwrite valid control-level applicability.
- Technical implementation evidence is not the same as a legal compliance conclusion.
- A control may only become `VERIFIED` when applicability is established, the control is implemented, evidence is current and a valid verification date exists.
- New Bedrijfsgeheugen security, AI, data, governance, release, recovery and compliance evidence should be added to the canonical self-evidence source rather than copied into customer state.
- Unknown legal scope must remain visibly unknown; do not fabricate `compliant`, `verified` or `not applicable` states.

### Uw organisatie

The `Uw organisatie` scope must show only the selected customer's compliance projection based on customer-entered portal data plus explicitly attached customer evidence.

Rules:
- Customer answers may establish context or applicability but must never manufacture evidence.
- Bedrijfsgeheugen self-evidence must not appear in the customer projection.
- Customer state must never overwrite, inherit or reuse Bedrijfsgeheugen's own compliance state.

## Required regression protection

The portal test suite must continue to prove at minimum:
1. Bedrijfsgeheugen controls/evidence remain visible while legal scope is unknown.
2. Per-control applicability is supported.
3. The Bedrijfsgeheugen UI contains a distinct self-evidence section.
4. That self-evidence section does not appear in the customer projection.
5. Customer input never manufactures evidence.
6. Evidence-first/fail-closed status semantics remain intact.

Any change that makes both scope buttons produce the same underlying projection, silently hides existing self-evidence, or copies Bedrijfsgeheugen evidence into customer state is a release-blocking regression.

## Canonical implementation references

- `portal-next/bedrijfsgeheugen-compliance-evidence.js`
- `portal-next/compliance-input-adapter.js`
- `portal-next/compliance-command-center.js`
- `tests/portal-compliance-command-center.test.mjs`

This invariant is part of the Compliance Command Center product contract and must be preserved in future refactors, redesigns and migrations.
