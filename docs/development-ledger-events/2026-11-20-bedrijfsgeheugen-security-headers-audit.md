# Veiligheidsaudit Bedrijfsgeheugen — 20 november 2026

- Bron: huidige GitHub `main` `_headers`, `netlify.toml` en actieve Netlify-website `bedrijfsgeheugen`. De publieke homepage heeft geen afgedwongen CSP, wel HSTS, X-Frame-Options en nosniff.
- Scope: behoud bestaande intern-slot identity, Supabase RLS en Netlify provider. Geen nieuwe scheduler, geen Make, geen brede authwijziging.
- Geleverde bronreparatie: consistente beperkte CSP-beveiligingen in beide Netlify-configuratieplaatsen; scripting report-only; aanvullende no-store/noindex/deny-frame headers op interne routes; read-only bewaking via de bestaande security-operations-workflow.
- CI-fout #1: oorspronkelijke header-test splitsde `_headers` op lege regels en vond de root-block met commentaar niet. Regressie gerepareerd met expliciete padregels en inspringing.
- CI-fout #2: verplichte PR metadata ontbrak; de originele immutable Base-SHA, Obligation-ID, Delivery-Lane en Candidate-Type zijn toegevoegd zonder beschermde checks te omzeilen.
- CI-fout #3: learning-gate accepteert uitsluitend `tests/brain-*.test.mjs` voor historische replay, shadow en canary; URL's en algemene testpaden staan nu apart als providerprobes, CI gebruikt echte bronregressies.
- CI-fout #4: integratie-gate vroeg een menselijk wijzigingsdocument en een activiteitledger, die bij deze commit zijn toegevoegd.
- Controle: tests en beschermde PR-checks uitvoeren, daarna alleen bij daadwerkelijk samengevoegde bron en onafhankelijke HTTP-providerreadback productiestatus als veilig geverifieerd registreren.
- Onafhankelijke database-audit (read-only): 208/208 onderzochte publieke tabellen RLS; 4 anonieme select-grants, 2 anonieme insert-grants; slechts één Supabase SECURITY DEFINER execute-waarschuwing, getokeniseerde RPC met een aparte bestaande cutover-PR (#5319). Dit is geen claim van pentest of gegarandeerde aanvalsvrijheid.
