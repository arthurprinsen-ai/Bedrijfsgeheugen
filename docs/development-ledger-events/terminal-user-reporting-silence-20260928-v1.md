# Terminal-only user reporting

Powerhouse scheidt voortaan interne delivery-observability strikt van gebruikerscommunicatie. GitHub/CI/Netlify/Supabase tussenstatussen blijven in machine-evidence en recovery-state, maar worden niet routinematig in chat weergegeven.

User-facing output is terminal-only: bewezen live/compleet, bewezen rollback/groen, of een echte harde externe grens met uitsluitend de kleinste noodzakelijke menselijke actie. Technische details worden alleen op expliciet verzoek getoond.

Regression: `tests/brain-terminal-user-reporting-silence-v1.test.mjs`.
