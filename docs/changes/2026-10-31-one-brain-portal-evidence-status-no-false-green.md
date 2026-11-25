# ONE BRAIN / Powerhouse Portal V2 — evidence status must never look falsely green
Date: 2026-10-31. Parent incident: #4198. Scope: original 15-loop Powerhouse–ONE BRAIN–Heartbeat portal only.

## Independent defect and impact
The existing `portal-v2/modules/powerhouse-observability.js` event/timeline classifier used positive substring matches such as `includes('verified')`, `includes('live')`, and `includes('proven')`. Therefore `UNVERIFIED`, `NOT_LIVE`, `NOT_PROVEN` and `UNPROVEN` could be displayed as **good**; `RED` and `AMBER` were not recognized, so a real red/orange Heartbeat incident could render neutral in error badges, error counts and event filters. The separate 15-loop assurance panel already had explicit colors but that did not protect the generic incident panels.

## Single canonical repair
One pure read-only status classifier in `portal-v2/modules/powerhouse-status-tone.mjs` now supplies the original existing portaal function. It uses evidence-denial and negative-meaning precedence over positive words, including status `RED/RECOVERY_DUE`, `AMBER`, `UNVERIFIED`, `NOT_VERIFIED`, `NOT_LIVE`, `UNPROVEN`, `UNFULFILLED`, `UNSUCCESSFUL`, and `PENDING_PROOF`. `NOT_REQUIRED` is neutral, never success.

No duplicate dashboard, scheduler, source writer, external sender or status mutation. The original `powerhouse_loop_assurance_state_v1` is the authority. All 15 original loops stay where actual independent guard/provider and revenue evidence put them.

## Test and release gates
`node --test tests/brain-portal-evidence-status-truth-20261031.test.mjs`
Tests assert exact RED/AMBER/GREEN mapping, negative-word truth, severity priority, original classifier use in event filters, errors and badges, and no alternate portaal status handler.
Required/CodeQL/portal tests + protected merge + native Netlify production SHA and browser/authenticated readback are mandatory. Merely creating PR does not mean live.

## Prevention contract
For each new canonical status code, test both positive and negative variants before promoting portal GREEN. A status label must never override missing provider-ID, authorization, opt-in, Mira 0.940 frame identity, original 15-loop guard or verified financial outcome. An agent may tag this visual defect resolved only after merged code + production readback; operational publication/debt/revenue deficits remain separately red/orange until proven.

## Owner and learning
Original owners: Portal V2 observability + ONE BRAIN original 15-loop guard, existing self-improvement agent. Machine ledger `brain/learning/2026-10-31-portal-status-false-green-v1.json`, original skill and AGENTS. Issue #4198 is single P0 aggregation, with no parallel executor.
