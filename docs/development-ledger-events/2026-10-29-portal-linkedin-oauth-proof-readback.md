# Ontwikkelregistratie: authentieke LinkedIn OAuth in portaalreadback

- 2026-10-29, productie. Oorspronkelijke single-writer contentlus selecteerde een nieuw brongebonden persoonlijk verhaal en keurde de content goed. Providerverzending faalde in preflight. Provider-ID: **afwezig**.
- Directe readback: `powerhouse_channel_decisions.linkedin_personal.state=content_ready`; `content_publication_obligations.linkedin_personal.status=APPROVED`, `external_id=NULL`; `evidence.provider_auth_preflight=failed`, `evidence.error=LINKEDIN_REAUTH_REQUIRED`; `last_error` leeg.
- Oorzaak: de admin-observability parseerde alleen `last_error`, waardoor de concrete, door Powerhouse bewezen OAuth-blokkade onzichtbaar was.
- Prepublicatiecontrole: originele Composio-workspace 9 ACTIVE labels, 0 gezonde providerverbindingen. ChatGPT-verbinding separaat; geen alternatief schrijfpad.
- Oplossing: uitsluitend provider_auth_preflight en error als scalar selecteren; portaalcode op categorie, geen ruwe secrets of provider-ID’s.
- Behoud: voorafgaande `external_id` en `LIVE_PROVEN` krijgen eerst no-repost-verwerking; duplicate-gate, 0,940 Mira, cron, writer, lease, skills en bewijscontract onveranderd.
- Verificatie-eisen: exact-head Required/BRAIN/CodeQL, beschermd merge, Netlify commit-pariteit, twee geauthenticeerde portaltenants en productierespons met herstelcode; bij ontbreken rood/UNVERIFIED. Vervolg: owner verbindt officiële OAuth-link binnen geldigheid; oorspronkelijke providerpublisher stuurt en verifieert pas daarna.
- Terugdraaien via beschermde revert, geen database reset of test omzeilen. ONE BRAIN-bronincident blijft open, 7 dagen regressiemeting vereist.
