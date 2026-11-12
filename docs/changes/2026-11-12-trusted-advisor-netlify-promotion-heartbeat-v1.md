# Trusted Advisor — canonieke Netlify-release voor verificatiebron (12 november 2026)

## Aangetoonde oorzaak
De onafhankelijke publieke website draait correct op SHA `839086756f2559b9abeb8decc8d945e2f0a3d919`. PR #5701 is daarna op beschermd main gemerged als `0c5a499670a216c5c079d5fc41a15326a79ddfa1` met alleen oorspronkelijke test-, controle- en leerbestanden. Netlify-productiedeploy `6af64350b459c7cc43e89005` is bewust **overgeslagen** door de bestaande selective-ignore-policy: `Canceled build due to no content change`. Dit mag niet als provider-onafhankelijk live bewijs worden gerapporteerd.

De bestaande oorspronkelijke brand-shell productiecheck wil een controleerbare runtime-identiteit. De publieke site hoeft niet inhoudelijk te wijzigen; de oorspronkelijke Git-gekoppelde Netlify-promotie is voldoende, mits provider/readback slaagt.

## Kleinste bestaande herstel
Eén commentaarregel in het al bestaande `netlify.toml` is een gedocumenteerd canoniek productie-heartbeatpatroon. Laat build-command, selective-ignore, redirects, headers, functions, secrets, i18n en klantenroutes **ongewijzigd**. De bestaande applicatieclassifier behandelt `netlify.toml` terecht als hosted runtime-impact en verplicht opnieuw bouwen. Eén BRAIN-regressie bewijst dit en controleert de overeenstemming tussen huidige websitecopy en oorspronkelijke live verifier.

## Terminal bewijs
Beschermde Required/CodeQL/websitecontroles, beschermde merge, een Netlify READY deploy met exact het samengevoegde main SHA, zichtbare nieuwe NL/EN header en **originele** postmerge Canonical brand shell live readback groen. Geen nieuw mechanisme, tweede build/agent/scheduler, rechtstreekse productiepush, verborgen content of claim van CRO- of omzetverbetering. Het oorspronkelijke klant- en commercieel bewijs blijft apart open.
