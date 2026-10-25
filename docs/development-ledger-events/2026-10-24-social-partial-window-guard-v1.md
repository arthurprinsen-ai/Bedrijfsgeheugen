# Hourly social learning partial-scope window safety — 24 October 2026

- Source defect: old `runEvaluation` considered every provider snapshot for 24/48/72-hour closest-age selection, regardless of data quality or provider-day scope.
- Risk: Windsor organic LinkedIn reporting-date observations newly connected under the canonical provider bridge could be treated as age-matured causal learning despite non-cumulative provider-date metrics.
- Fix: existing evaluator restricts to independently observed original time-window snapshots; partial/unverified sources create typed obligations. Valid legacy observed windows stay eligible.
- No new scheduler, extra publisher, artificial attribution, fake likes or customer orders. Exact Required/CodeQL, Netlify live source and evaluator evidence demanded.
