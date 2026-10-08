# Portal V2 — three evidence-based priorities and reliable scenarios

## Existing state
The canonical `/portaal` route serves Portal V2. Brain has canonical operational records, decision-cycle events, a portfolio allocator and next-best-action projections. Portal V2 already contains a company cockpit, forecast UI, and a scenario engine. This is an in-place correction, not a second product, state store or commercial dispatcher.

## Change
Display the three highest-ranked decisions prominently while preserving additional decisions in an expandable list. Show unknown financial values and confidence as unknown rather than €0/0%. Correct scenario and difference calculations so null or empty measurements cannot be converted into fabricated zeros; true measured zero remains valid.

## Regressions
`tests/brain-portal-v2-three-priorities-truth-v1.test.mjs`: unknown baselines, numeric zero/string handling, priority ordering, additional-list access and truthful display.

## Release evidence
Protected admission, Required, CodeQL, Netlify preview, protected merge, production deploy and readback are required. Existing historical records are not proof that this PR is live. This PR does not establish verified daily outbound commercial delivery or selective recomputation of every event dependency.
