# Powerhouse: ondernemerservaring V1 (15 oktober 2026)

Obligation-ID: `powerhouse-owner-operating-experience-20261015-v1` · Issue #4405

## Bereik
Binnen de canonieke `portal-v2/`-shell staat één ondernemersbesturing met vijf onderdelen: Mijn bedrijf, Mijn kansen, Mijn acties, Mijn adviseur en Mijn instellingen. De bestaande volledige navigatie, Netlify Identity, tenantgebonden Portal State, Brain executive projection, actiebeleid, scenario-engine en modelkeuze blijven eigenaar van hun respectieve bevoegdheden.

- **Mijn bedrijf:** actuele prioriteiten, geverifieerde prognoses en financiële KPI-plaatsen; ontbreken echte financiële datasets, dan expliciet `—`.
- **Mijn kansen:** tenantgebonden bronnen met geldige evidence-envelop, actuele freshness en confidence; indeling omzet, marge, klantbehoud, operatie en risico.
- **Mijn acties:** voorstellen, risicoklassen, beslisbehoeften en uitsluitend geverifieerde outcome-tellingen. Externe uitvoering vindt hier **niet** plaats; bestaande besluitregistratie / provider-readback blijven autoritatief.
- **Mijn adviseur:** bestaande `/api/portaalvraag`-route met tenantgebonden modelrouting, expliciete weigering bij ontbrekende providerautorisatie en zichtbare answer assurance.
- **Mijn instellingen:** bestaande routes voor connectors, gebruikers, AI-modelkeuze, datasoevereiniteit en toegang. Modelkeuze blijft een aanvraag en schakelt geen provider automatisch in.

## Datagrenzen en beleid
De huidige browserprojectie `powerhouse.executive` levert geen betrouwbare, generieke financiële actuals. Daarom worden omzet, marge en toekomstige cashpositie nooit afgeleid uit voorbeeldcijfers. Alleen records met tenant-ID, geldige evidence-envelop, niet-verouderde bronnen, minimaal vertrouwen en niet-lege `source_refs` zijn zichtbaar als brononderbouwde feiten. Alleen outcomes met geverifieerde eindstatus tellen mee. Externe, financiële of klantgerichte acties vereisen expliciete autorisatie; een UI-voorstel is geen verzend- of uitvoeringsbewijs.

## Acceptatie en volgende lagen
1. Test: missing state, tenant-isolatie, freshness, XSS-escaping, classificatie en vijf schermdelen.
2. Required CI/CodeQL + beschermde merge.
3. Exacte Netlify deploy + geauthenticeerde klant-readback. Zolang dit ontbreekt is de oplevering niet bewezen live.
4. Voor echte omzet-, kas-, marge- en tijdwinstcijfers: betrouwbare, tenantgebonden ERP/CRM/finance-bronnen, doelwaarden, forecastkwaliteit en onafhankelijke outcome-evidence.
5. Voor autonome externe handelingen: expliciete rollen en policies, brongebonden toestemming, duurzame idempotente job/outbox, provider-write/readback en resultaatmeting via de bestaande Brain-executieketen. **Geen** parallelle sender of nieuwe tenantdatabase is toegevoegd.

## Canonieke bestandsset
`portal-v2/owner-operating-model.js`, `portal-v2/owner-operating-system.js`, `portal-v2/owner-operating-system.css`, minimale aansluitingen in `page-registry.js`, `page-shell.js`, `modules/overview.js`, met `tests/owner-operating-system.test.mjs`.
