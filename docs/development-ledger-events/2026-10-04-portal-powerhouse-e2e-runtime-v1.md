# Development ledger — Portal ↔ Powerhouse E2E runtime

- Datum: 2026-10-04
- Obligation-ID: portal-v2-powerhouse-e2e-runtime-20261004
- Probleem: Portal runtime-readback miste Bearer-auth en gebruikte mutable source-state voor derived Brain data.
- Herstel: authenticated readback + derived-state API + canonical runtime bridge + same-lineage interaction evidence.
- Canonieke backend: Netlify Identity → Netlify API → Supabase brain-operating-authority / portal-state-eu.
- Canonieke frontend: Portal V2 Domain State + Powerhouse runtime bridge.
- Geen DDL of nieuwe parallelle database geïntroduceerd.
- Supabase security advisor gecontroleerd; bestaande service-only/RLS architectuur is niet versoepeld.
- Regressies: central Brain E2E regression + Portal runtime evidence + bridge behavior.
- Production closure vereist protected merge, Netlify exact SHA en Portal V2 Production DOM Readback.
