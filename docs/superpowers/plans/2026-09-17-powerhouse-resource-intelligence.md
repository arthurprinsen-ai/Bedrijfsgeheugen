# Powerhouse Resource Intelligence — implementatieplan

## 1. Contracttests eerst
- Voeg een repo-test toe die migration/agent/portal contracten controleert: provenance classes, tenant scope, compliance frameworks, daily optimizer, cron, portal page registration en hard-gate tekst.
- Test mag geen numerieke energie/waterfactor eisen: unknown is geldig en veiliger dan verzonnen data.

## 2. Canonieke database-uitbreiding
- Voeg een forward-only migration toe.
- Hergebruik `brain_budget_usage` als append-only raw facts.
- Voeg een enriched projection en tenant snapshot function toe.
- Voeg versioned compliance framework/control registry toe met officiële bron-URLs en evidence-oriented status.
- Voeg daily Resource Intelligence optimizer function toe die alleen state/obligations autonoom muteert; provider-side actie vereist expliciete preapproved adapter/policy.
- Schedule idempotent daily cron.

## 3. Agent hard gate
- Breid `AGENTS.md` uit met Resource Intelligence decision gate, provenance, no-fake-precision, Pareto/guardrail policy en connector telemetry contract.

## 4. Portal V2
- Registreer `resource-intelligence` als native Data & intelligence / Continuïteit & risico page.
- Render echte tenant snapshot-data wanneer aanwezig; anders expliciete unknown/geen bewijs state.
- Koppel links naar compliance, AI capabilities, CSRD en outcomes/evidence.

## 5. Productie
- Apply migration.
- Run SQL regression/readback.
- Check Supabase security + performance advisors.
- Open PR, required CI green, protected merge exact head.
- Verify Netlify exact commit deployment and production route/readback.
- Run daily optimizer manually once as deterministic production proof; natuurlijke scheduler blijft canonical recurring proof.

## 6. Writeback
- Schrijf current state + learning via bestaande Powerhouse authority.
- Provider telemetry die niet via huidige APIs beschikbaar is wordt `UNKNOWN` + concrete integration obligation; geen fabricated cost/energy/water.