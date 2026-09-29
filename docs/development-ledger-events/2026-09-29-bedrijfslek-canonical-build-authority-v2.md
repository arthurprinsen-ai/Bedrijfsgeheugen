# 2026-09-29 — Bedrijfslek canonical build authority v2

Root cause confirmed by production readback: `main/zelfscan.html` contained the 12-question Bedrijfslek, while the current Netlify production artifact still exposed the legacy six-question selfscan.

Change:
- capture canonical `zelfscan.html` before legacy website builders;
- restore it after those builders;
- project canonical shell/UI after restore;
- only then generate locale routes and the final release artifact;
- fail the Bedrijfslek artifact contract on `Beantwoord zes vragen`.

Terminal evidence must include a public production readback of `/zelfscan`, not only commit/deploy identity.
