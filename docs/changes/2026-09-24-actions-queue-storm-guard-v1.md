# GitHub Actions queue-storm guard — 24 september 2026

## Root cause
De repositorybrede recovery-supervisor draaide zowel op iedere push naar `main` als iedere vijf minuten. Met tientallen open PR's kon één cyclus opnieuw meerdere recovery-workflows dispatchen en zo bestaande Actions-capaciteitsdruk versterken.

## Fix
- geen repositorybrede recovery-scan meer op `main` push;
- schedule teruggebracht naar iedere 15 minuten;
- circuit-breaker bij 20 actieve/queued/pending/waiting/requested runs;
- maximaal één PR-recovery per supervisorcyclus;
- bestaande branch protection blijft intact.

## Preventie
Recovery-automatisering moet backlog reduceren en mag nooit zelf nieuwe fan-out veroorzaken wanneer de control plane al verzadigd is.

## CI-scope preventie
De recovery-supervisor en zijn regressietest zijn expliciet non-artifact control-plane voor website release-risk. Daardoor start een CI-only herstelwijziging geen volledige publieke websitebrowsercrawl meer. Dit reduceert runnerdruk en voorkomt dat een queue-reparatie zelf opnieuw onnodig veel CI-capaciteit gebruikt.
