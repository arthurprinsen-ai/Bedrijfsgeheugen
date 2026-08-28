# Development Ledger Event — Brain live control-plane wiring

- Datum: 2026-08-28 23:19 Europe/Amsterdam
- Type: CONTRACT_CHANGE / IMPROVEMENT
- Fingerprint: `brain|live-control-plane|v1.4|20260828`
- Owner agent: PH Agent 13 — Architect / Integrator

## Doel
Na productie van de Brain foundation moesten de bestaande Powerhouse-lagen ook live dezelfde Brain-taal en gedeelde besliscontext gebruiken, zonder parallelle scheduler of tweede waarheid.

## Wijzigingen
- BG167 Shared Multi-Agent Team Context Hub is uitgebreid naar `TEAM-CONTRACT-v1.4-BRAIN` met `BEDRIJFSGEHEUGEN-BRAIN-v1`, universele objectflow en expliciete cortex-map voor research/evidence, identity/relationship, market/opportunity, commercial, creative/prompt, SEO/demand, product/website/UX, operations/reliability, economics, security/governance en learning/memory.
- BG158 Daily Improvement Controller behoudt bestaande technische/cost-dispatch maar produceert daarnaast een deterministische cross-domain `brain_portfolio` en `brain_top_candidate` in SHADOW mode. Hard interrupts en evidence/confidence gating gaan voor utility ranking.
- BG166 Error & Learning Ledger accepteert Brain core event metadata en onderscheidt `BRAIN_SIGNAL`, `BRAIN_DECISION`, `BRAIN_MISSION`, `BRAIN_OUTCOME` en `BRAIN_PATTERN` in append-only shared learning.
- BG168 Outcome & Learning Router accepteert nu expliciete Brain `SIGNAL`, `OPPORTUNITY`, `DECISION`, `MISSION`, `OUTCOME` en `PATTERN` events naast bestaande material-learning classes; events krijgen `brain.v1` schema lineage.
- De bestaande `Powerhouse Daily Optimizer + Opportunity Radar` automation is zonder hogere frequentie omgezet naar `Powerhouse Daily Optimizer + Brain Portfolio`. Hij leest eerst BG167, verzamelt delta-signalen over alle cortices, gebruikt BG158 voor cross-domain shadow ranking, schrijft material decisions via BG168/BG166/BG167 terug en houdt de Creative/Prompt Cortex als één gekoppelde learning-loop.

## Verification
- BG167 contract refresh execution `7753241123c745bbad0ba859ebfc0032`: success, TEAM-CONTRACT-v1.4-BRAIN returned.
- BG167 post-writeback refresh `4efcefff6c38404fabb2b16ca5201282`: success; `CONTRACT_CHANGE — BG167` visible in latest shared learning.
- BG158 cross-domain canary `ce4aa4d685844830bc8efb20ac14d8ac`: success. Commercial candidate ranked above SEO; low-confidence product candidate reduced to `RESEARCH`; no actuator side effects.
- BG168 Brain Decision routing canary `8d9996e9eca0439bbf0aad086cf4f7be`: success, `LEARNING_DISPATCHED`, kind `DECISION`.
- BG167 verification refresh `30bc5444f69241678770679d12ea0867`: success; newest shared learning contains `DECISION — BG158` with signal type `BRAIN_DECISION`.
- Production foundation remained exact GitHub main `8bc6adf55b07253d0a6e72afd383e545aa47b0b9` at the time of live wiring and Netlify deploy `6a91f93afba2440008a6c952` was READY with exact commit_ref. Subsequent docs/ledger-only production commits do not alter the Brain runtime logic.

## Safety / rollback
All new daily cross-domain ranking is SHADOW. Existing cost/self-heal dispatch behavior is preserved. No extra polling frequency was introduced. No credentials, permissions, security controls, destructive data or paid-resource increases were changed. Each changed Make scenario can be restored to its immediately preceding blueprint if regression is observed.

## Herbruikbare regel
A Powerhouse component is Brain-ready only when its role/cortex/authority are in the component registry, its material events preserve shared lineage, its decisions are visible through BG166/BG167/BG168, and its side effects remain behind the appropriate autonomy, security, cost/quality and production gates.
