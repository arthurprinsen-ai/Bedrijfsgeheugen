# Canonieke AGENTS instructie — LinkedIn buyer-first permanent

## Waarom deze aanvullende wijziging
PR #5243 is in de beschermde hoofdbranch gemerged en de oorspronkelijke Supabase-redactiecode werd aantoonbaar actief. De oorspronkelijke persoonlijke Notion-skill, profielregels en social-CRO-agent-skill zijn bijgewerkt. De algemene onboarding `AGENTS.md` bevatte nog **geen specifieke regel** voor de gemeten fout met een generieke AI-openingszin en interne statuscijfers, waardoor toekomstige agent- of skillversies de regel kunnen vergeten.

## Aanpassing
We voegen een compacte, versioned root-instructie aan `AGENTS.md` toe. Die verwijst uitsluitend naar de bestaande oorspronkelijke generator, reviewer, publisher, ONE BRAIN, Heartbeat, SkillOps en Portal; er wordt geen nieuwe agent, scheduler, webhook of commerciële claim aangemaakt. De waarschuwing geldt voor oprichterscontent en zakelijke LinkedIn-posts; persoonlijke verhalen over gewone privé-ervaringen blijven gewoon persoonlijk.

De regressie `tests/brain-buyer-first-root-agent-invariant-20261101.test.mjs` toetst de koppeling van algemene agentregel naar daadwerkelijke redactionele v4/v2-functies. De productie-eenheden blijven dezelfde als na #5243 (Supabase v509/463/728 en Netlify deploy `6ae7a4ad7bccaf96a14b6297`). Deze PR is alleen een langetermijninstructiecorrectie, geen bronpublicatie.

## Definitie van klaar
Beschermde Required/BRAIN/CodeQL groen, de juiste HEAD gemerged, oorspronkelijke ONE BRAIN leren vastgelegd. Aantoonbare verhoging van views of betaalde opdrachten is nog **onbewezen** en blijft een aparte uitkomstverplichting; geen vals groen, geen dubbel geplaatste posts. Original issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439.
