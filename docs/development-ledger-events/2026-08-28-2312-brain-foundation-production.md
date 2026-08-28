# Development Ledger Event — Bedrijfsgeheugen Brain Foundation Production

- Datum: 2026-08-28 23:12 Europe/Amsterdam
- Type: PRODUCTION_PROMOTION / CONTRACT_CHANGE / IMPROVEMENT
- Fingerprint: `brain|foundation|production|8bc6adf55b07253d0a6e72afd383e545aa47b0b9`
- Owner agent: PH Agent 13 — Architect / Integrator

## Signaal / doel
Bedrijfsgeheugen moest van losse specialistische Powerhouse-processen naar één gedeeld Brain-contract waarin bestaande sales-, research-, SEO-, creative/prompt-, website/product-, operations-, cost-, security- en learning-lagen als één systeem samenwerken.

## Baseline
Productie-main vóór promotie: `186f0615b2c85549c165c0a26ccd2b1000fcb18b`.
Bestaande Powerhouse control-plane bleef leidend: BG156 orchestration, BG166 append-only learning, BG167 shared current context, BG168 outcome/learning routing en BG169 production authority.

## Implementatie
PR #123 implementeerde de Brain foundation zonder stable specialist scenarios te vervangen. Toegevoegd zijn onder meer:
- component registry en universele Brain-contracten;
- Signal/Evidence/Opportunity/Decision/Mission/Experiment/Outcome/Pattern/Current State contracten;
- deterministic hard gates, expected-utility scoring, portfolio/WIP policy en WAIT/RESEARCH/PAUSE behavior;
- authority-aware Context Compiler;
- Creative & Prompt Cortex die BG09, BG14, BG24, BG25 en BG180 expliciet samenbrengt;
- data-quality, quarantine en identity/evidence safeguards;
- Make adapter authority map;
- side-effect-free shadow decisions en calibratie;
- autonomy/Safety Kernel;
- production constitution;
- economic budget/compute routing;
- observability/trace invariants met recovery signals;
- end-to-end Brain learning regression proof en dedicated CI.

## Live Powerhouse-integratie
BG168 accepteert `SHADOW_DECISION` als expliciete material-learning class. BG166 slaat die op als `POWERHOUSE_SHADOW_DECISION` in plaats van als fout. Shadow-canary execution `3011f4e5769348aeaa498561cd0cb849` was succesvol en had geen actuator-side-effects.

BG156 behoudt fail-closed uitvoering en produceert Brain shadow context naast bestaande governed repair paths. BG169 blijft de deterministische productie-autoriteit en bewaakt exact candidate/base/CI/preview/rollback/production identity.

## Verification
Exact geteste PR-head: `d79c750c4389d872ee185d309eba55a29b359470`.

Groene gates op exact die head:
- GitHub `Brain foundation verify`: success;
- GitHub `Shared Agent Memory Tests`: success;
- Netlify deploy-preview PR #123: success.

Mergecommit / productie-main: `8bc6adf55b07253d0a6e72afd383e545aa47b0b9`.
Netlify production deploy: `6a91f93afba2440008a6c952`.
Netlify state: READY.
Netlify `commit_ref`: `8bc6adf55b07253d0a6e72afd383e545aa47b0b9`.
Secret scan: 0 matches across 516 scanned files.
Primary production URL: `https://www.bedrijfsgeheugen.nl`.

## Shared learning writeback
BG168 production-promotion execution: `bae602fc70614f4b9251bc3b4a187e6f`, status success, material learning dispatched.
BG167 context refresh execution: `c917f8cf3f074a71a2265b4826c70f45`, status success. Latest Team Memory now contains the Brain production promotion as newest production fact.

## Rollback / last-known-good
Last-known-good before promotion: `186f0615b2c85549c165c0a26ccd2b1000fcb18b`.
BG169 remains the rollback authority. Productieregressie must restore LKG and keep the Brain candidate in RECOVERING until a new hypothesis is green.

## Herbruikbare les / preventieregel
Do not rebuild specialist intelligence beside the Powerhouse. New Brain capabilities must connect through the universal contracts and shared authority model. Creative/prompt learning is component-level and cross-domain; a winning prompt or asset is evidence for mechanisms, never a global template. Any new active agent or scenario is not Brain-ready until it has shared-context read, traceable contract I/O, material-outcome writeback, idempotent mutation behavior and the relevant safety/production gates.
