# Production readback release identity v1

De productie-readback koppelde twee verschillende bewijsvragen aan één wachtstap: **is exact deze merge-SHA live?** en **voldoet de prijzenpagina nog aan een specifieke inhoudsvariant?** Daardoor bleef een aantoonbaar correcte productie-deploy wachten op verouderde pricing-asserties.

De herstelregel scheidt die verantwoordelijkheden. De deploy-wachtstap bewijst uitsluitend de exacte release-identiteit en de canonieke shell: live release marker, production context en Netlify deploy-id moeten overeenkomen. De bestaande live-contractcontrole blijft standaard streng voor pricing-semantiek; de afzonderlijke browser- en pricing-gates blijven eigenaar van inhoud en interactie.

Dit verzwakt geen gate. Het voorkomt juist dat een niet-gerelateerde UI-contractwijziging de release-identiteit onbewijsbaar maakt en zorgt dat iedere fout door de juiste gate wordt afgehandeld.

Geobserveerde productie-evidence voor de oorspronkelijke merge:
- merge SHA: `6a9452fa905073290c9274c2364d2aaaa52ad492`
- Netlify deploy: `6ac3d4bbc857e90008998389`
- state: `ready`
- context: `production`
- live `release.json`: dezelfde commit-ref en deploy-id.
