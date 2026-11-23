# 2026-11-15 — Financieel beslis- en resultaatdossier: original Portal V2 / ONE BRAIN

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Werkelijk gemeten uitgangssituatie
Productie heeft 14.732 rijen in powerhouse_action_business_value_v1, allemaal business_value_status=no_resource_evidence. Daarvan hebben 829 status done maar geen geverifieerde netto waarde. portal_financial_forecasts_v1 heeft 0 rijen en powerhouse_realized_values heeft 0 rijen. De oude Impact-pagina maakte afwezige getallen via ||0 zichtbaar als EUR0. Geen van deze aantallen rechtvaardigt een claim over gerealiseerde klantbesparing.

## Eén bestaande, geauthenticeerde keten
De oorspronkelijke customer-value-briefing op de Executive Cockpit wordt als read-only beslisdossier aangevuld. Geen nieuwe UI-root, scheduler, agent, modelwinkel, banktransactie, datastore of autonome provider-write. Alle hypothetische en gerealiseerde financiële data moeten van de oorspronkelijke tenant-scoped executive source komen.

## Contract voor voorspellende en causale intelligentie
- Verplicht één brongebonden financieel forecast-record per oorspronkelijke actie met modelversie, periode, metric, baseline, EUR, evidence-health, modelnaam en -versie, source_refs voor aannames en ieder scenario.
- Scenarioreeks moet precies de vier onderscheidbare gevallen no_action, downside, base en upside bevatten, elk met eigen bron en nettowaarde. De vier bedragen zijn hypotheses, nooit gerealiseerde besparingen.
- Financiële frictie en theorietags mogen alleen afkomstig zijn uit gekoppelde, brongevalideerde scenario-evidence. Zonder input blijft de waarde onbekend; nooit rekenkundig verzonnen percentages of triviale EUR0.
- Werkelijk netto bespaard is alleen zichtbaar bij oorspronkelijke onafhankelijke uitvoering, echte providerontvangst, geverifieerd outcome, exact action/tenant/baseline/period/metric, no-action-vergelijker en onderbouwde bruto besparing minus implementatiekosten minus operationele kosten. Een schatting of status done telt niet.
- Forecast versus actual alleen berekenen bij identieke eenheid, metric NET_SAVINGS_EUR, baseline en periode. Causale attributie blijft onbewezen zonder apart tegenfeitelijk bewijs.
- Alleen een read-only closingEligible-signaal is toegestaan, met behoud van de bestaande ONE BRAIN-permission/closure-authority. De uitvoerende eigenaar sluit de actie pas na werkelijk providerbewijs, netto outcome en volgende leerbeslissing.

## Bronkoppeling nog vereist
De financieringsdatabronnen zijn nog leeg voor echte tenant-forecasts en gerealiseerde besparingen. De originele data spine moet echte operationele volumes, kostprijzen, tijd, investeringen, financiële actuals en verificatie per tenant leveren. Geen nepgegevens invullen, geen geconstrueerde EUR0. In deze PR zijn de weergave en de correctheidsvoorwaarden toegevoegd; geen aangetoonde klantbesparing of afgeronde actie.

## Verificatie
Relevante regressie: tests/brain-financial-decision-proof-20261115.test.mjs, plus bestaande customer-value en multisector lineage-tests. Beschermde Required en CodeQL op exact head, vervolgens merge, Netlify exact commit/READY en oorspronkelijke ONE BRAIN terminal readback. Alleen de gespecificeerde front-end source-fix mag live worden genoemd wanneer die poorten echt zijn voldaan.
