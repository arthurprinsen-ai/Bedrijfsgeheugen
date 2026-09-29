# Public CMS/i18n Powerhouse borging — 2026-09-29

De publieke website is nu expliciet één Powerhouse-capability. Dezelfde site-shell beheert header, footer, mega-menu, navigatie en NL/EN-switching.

Permanente invarianten:
- Nederlands gebruikt canonieke on-geprefixte routes.
- Engels gebruikt `/en/*`.
- Taalwisselen behoudt dezelfde functionele pagina: `/x ↔ /en/x`.
- Build-time localized routes zijn primaire authority; runtime i18n is een defensieve guard.
- I18n-assets zijn versiegebonden tegen stale browser/CDN-code.
- Terminale status vereist protected merge, Netlify exact-current-main en live NL→EN→NL browser-readback.
- Chats en agents tonen geen interne CI/deploy-tussenstatus aan de gebruiker; alleen terminale status of een echte harde grens.

Deze regels zijn doorgezet naar AGENTS, relevante skills, Brain policies en de machineleesbare System Map.
