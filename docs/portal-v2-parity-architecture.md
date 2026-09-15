# Portal V2 parity architecture

Fingerprint: `portal-v2-saas-presentation-parity-v1`
Assurance: `portal-v2-assurance-parity-v2`

## Non-negotiable invariant

Portal V2 is not a second or reduced customer portal. It is the modern SaaS presentation layer of the same Bedrijfsgeheugen Powerhouse capabilities. UX may change; protected business meaning and functionality may not silently disappear or diverge.

```text
Powerhouse canonical data
  -> intelligence + business logic
  -> shared portal services
  -> legacy portal (migration golden baseline)
  -> Portal V2 (modern SaaS UI)

Portal V2 input/interactions
  -> tenant-scoped canonical Powerhouse writeback
  -> intelligence / advice / forecasts / Next Best Action / learning
```

Forbidden target state:

```text
legacy portal -> private logic/state
Portal V2     -> different private logic/state/database
```

## Completion gate per legacy capability

A legacy capability may be marked `verified` in V2 only when all of the following are proven equivalent:

1. content and explanatory text;
2. analyses, calculations, scores, interpretations and conclusions;
3. charts, canvases, downloads, actions and other outputs;
4. inputs and interactive behaviour;
5. canonical Powerhouse data/intelligence binding with tenant/provenance/freshness/confidence where relevant;
6. writeback through the existing canonical Powerhouse state path;
7. downstream closed-loop effects on advice, NBA, forecast, calibration or learning where applicable;
8. production behaviour/readback.

A route, placeholder, schema field or inventory record alone is not parity evidence.

## Status model

- `contracted`: legacy capability is inventoried and has a V2 contract; runtime equivalence is not proven.
- `implemented`: executable V2 implementation/tests exist; complete production equivalence remains pending.
- `verified`: content + functionality + Powerhouse binding + writeback + production behaviour are proven equivalent and production evidence is verified.
- `retired`: capability has explicit retirement/supersession and migration evidence.

The assurance validator must reject `status=verified` when `production_evidence_status!=verified`.

## Legacy is the migration golden baseline

Nothing is removed from V2 merely because a new design prefers fewer fields or cards. Each legacy route is decomposed into capabilities and compared with its V2 equivalent. Retirement is an explicit architectural decision, not an accidental migration side-effect.

## Shared services rule

New V2 presentation code must consume canonical Powerhouse state and shared portal services rather than introducing a new V2 database, new scoring authority, new AI brain, new learning store or duplicate business logic. Any temporary legacy-derived compatibility logic remains migration debt until extracted/reused as a shared service and proven against the golden baseline.

## Canvassen audit — 2026-09-15

The previous generic V2 functional definition reduced each canvas largely to `kernvraag` + `eigenaar`, despite the legacy inventory promising six editable canvases plus a canvas conclusion. The parity implementation now has a dedicated canvas workspace containing:

- Business Model Canvas;
- Waardepropositiecanvas;
- Lean Canvas;
- Merkcanvas;
- Contentcanvas;
- Salescanvas;
- derived canvas analysis/conclusion;
- editable values, owner and question;
- canonical domain-state writeback/flush.

Status remains `implemented`, not `verified`, until exact golden-master and production readback are green.

## BCG and remaining routes

BCG is an explicit example of the same rule: showing a route, empty form, label or generic card is not equivalent to the legacy BCG analysis with actual values, explanation and conclusions. BCG and every remaining protected legacy capability remain open until the same completion gate above is satisfied.

## Machine-readable authority

- `powerhouse/assurance/portal-v2-parity.json`
- `scripts/powerhouse-assurance-check.mjs`
- `.github/scripts/portal_parity.py`
- `portal-v2/legacy-functional-inventory.js`
- executable V2 workspace tests
- production/browser/provider readback

Implementation PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/1643
