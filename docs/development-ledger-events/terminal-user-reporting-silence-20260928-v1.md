# Terminal-only user reporting

Powerhouse scheidt voortaan interne delivery-observability strikt van gebruikerscommunicatie. GitHub/CI/Netlify/Supabase tussenstatussen blijven in machine-evidence en recovery-state, maar worden niet routinematig in chat weergegeven.

User-facing output is terminal-only: bewezen live/compleet, bewezen rollback/groen, of een echte harde externe grens met uitsluitend de kleinste noodzakelijke menselijke actie. Technische details worden alleen op expliciet verzoek getoond.

Regression: `tests/brain-terminal-user-reporting-silence-v1.test.mjs`.

## Reinforcement v2

Fingerprint: `delivery|terminal-continuation|no-internal-handoff|v2`.

Repeated user feedback closed the remaining gap between “do not narrate pending state” and “do not stop on pending state”. Canonical ownership now explicitly survives ref/PR drift, queued gates, deploy/readback waits and chat/client timeouts; recovery resumes from shared state and deduplicates side effects before continuing.
