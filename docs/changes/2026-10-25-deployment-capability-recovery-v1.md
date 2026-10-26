# Deployment capability recovery — 25 oktober 2026

GitHub/Netlify connector tooling kan read-only zijn en mag geen schrijfmogelijkheden verzinnen. De bestaande Git-gekoppelde productiebranch blijft de voorkeursroute. De nieuwe `.agents/skills/deployment-capability-recovery/SKILL.md` en verwijzing in `AGENTS.md` definiëren de gecontroleerde routing, providerbewijs en expliciete status BLOCKED bij ontbreken van rechten.

Deze PR voert geen deployment uit en is geen runtime-automatisering. De bestaande Janitor kan pas toezicht houden na aantoonbare code-integratie; geen tweede scheduler. Required, CodeQL, preview, beschermde merge en productiereadback blijven verplicht.
