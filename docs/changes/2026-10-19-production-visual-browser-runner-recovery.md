# Productie-browsertest: compatibele runner zonder veiligheidsomzeiling

## Wat er misging
De canonieke website- en SEO-productiecontroles waren groen op commit `3404f09a26db4fe1d787ced2eb65dda178b70878`, maar de aanvullende echte browsertest werd nooit uitgevoerd. GitHub Actions gebruikte via `ubuntu-latest` Ubuntu 26.04. De vastgepinde Playwright 1.55.0-browserinstallatie faalde met `Playwright does not support chromium on ubuntu26.04-x64`. Het oorspronkelijke CI-resultaat bleef terecht rood: geen screenshots/DOM-bewijs.

## Herstel in de bestaande keten
Alleen de bestaande `production-readback`-job gebruikt voortaan `ubuntu-24.04`. De site, data, overige workflowstappen, browserinstallatie, zichtbaarheidstest en visual-regressiontest blijven verplicht. Geen alternatieve browser zonder bewijs, geen `continue-on-error` en geen nieuw deploymentpad.

## Voorkoming
Een nieuwe regressietest legt de runtimecompatibiliteit vast. Bij een toekomstige runner- of Playwright-upgrade moet de combinatie expliciet worden getest. Een deterministische incompatibiliteit wordt niet opnieuw als tijdelijke netwerkfout behandeld. Het incident is teruggeschreven naar Brain en append-only ontwikkelledger.

## Open acceptatie
Deze documentatie en de PR zelf zijn geen LIVE-bevestiging. Vereist: alle exacte commitchecks succesvol, beschermde merge, daarna echte productie-browsertest en visuele pagina-readback op een aantoonbaar actuele Netlify-deployment. Zie [de mislukte eerdere run](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39294416171).
