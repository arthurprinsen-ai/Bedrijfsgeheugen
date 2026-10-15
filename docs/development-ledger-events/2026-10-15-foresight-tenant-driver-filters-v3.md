# 2026-10-15 · Foresight tenant-driver filters v3
Obligation-ID: `powerhouse-foresight-tenant-driver-filters-20261015-v3`
Root issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4420
Origin: protected main `d7c267a2043995a0beb6c2c50335566d14b53862`.
Already live: tenant evidence overlay PR #4427; old conflicting candidate PR #4425 is not the runtime authority.

Delta: existing Portal V2 tenant evidence overlay gains risk/opportunity/development filters and source refresh bound to the existing authenticated customer API. The numerical scenario engine is deliberately unchanged.
Invariants: no duplicate loader; no cross-tenant source; no global forecast interpreted as customer data; no causal/monetary claim from impact score; missing evidence stays explicitly missing.
State: candidate, not productively verified. Required CI, CodeQL, protected merge, Netlify deploy, and live tenant readback remain gates.
