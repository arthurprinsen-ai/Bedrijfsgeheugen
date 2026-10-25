# 2026-10-25 — Revenue learning bounded, fair and evidence-backed

## Verified gap
The canonical Netlify hourly evaluator already exists. In production 107 website evidence rows have data_quality=INFERRED and none should prove sales or a creative winner. Social evaluations are being recorded, but actual verified learning application remains scarce. Existing revenue reports show €0 independently observed positive revenue over the inspected window.

## Change
Use the existing hourly executor and existing stores. Select a bounded set of up to eight due items, covering distinct channels fairly before any channel fills remaining slots. Only accept observed evidence with explicit source references for both target and cohort. Inferential/unqualified data becomes an obligation to collect proper evidence, not a claim of causal effect. Emit an auditable work summary and fail the runner on a real store exception.

## Protected acceptance
- Positive and negative regressions in the test listed in Brain.
- Required, CodeQL, protected merge, exact deployed Netlify readback.
- Observe next actual hourly run and source-bound metrics; no fake conversion/revenue.
- Do not weaken OAuth permissions, customer privacy, explicit consent, anti-spam pressure or duplicate-send gates.
- No new workflow, cron, executor or database.

## Independent commercial proof
Reported paid revenue must be a provider/invoice-backed economic outcome, linked to a campaign touch or action where available. Provider delivery, site visits, leads, booked meetings and paid orders remain distinct states.
