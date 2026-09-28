# Auxiliary workflow trigger fan-out prevention v1

## Probleem

Na het versmallen van de canonical Required lanes startten op een control-plane-only PR nog drie onafhankelijke workflows: SEO growth intelligence, Fresh Device Autonomy Canary en Powerhouse Assurance. Hun `pull_request.paths` verwees rechtstreeks naar generieke delivery-policy/classifierbestanden.

## Oplossing

De workflows luisteren voortaan alleen naar hun eigen domeininputs en hun eigen workflowdefinitie:
- SEO growth intelligence niet meer naar `config/brain-delivery-system.json`;
- Fresh Device Canary niet meer naar `config/brain-delivery-system.json`;
- Powerhouse Assurance niet meer naar `tools/brain-delivery-system.mjs`.

De workflowdefinities zelf zijn expliciet geclassificeerd op een owned control-plane lane, zodat een workflowwijziging wel degelijk de juiste validatie krijgt.

## Safety

De canonical Required-regressies blijven verantwoordelijk voor delivery-policy/classifierwijzigingen. Domeinwijzigingen aan SEO, assurance of device-certification blijven hun auxiliary workflow normaal triggeren.
