# Pricing 100% parity — production promotion race

## Situatie
De inhoudelijke parity-recovery was correct gemerged, maar een parallel pricing-traject werd later door Netlify als current production artifact gepubliceerd. Daardoor liep GitHub `main` vóór op wat publiek op `/prijzen` stond.

## Root cause
GitHub-main en Netlify-current waren tijdelijk verschillende delivery-lineages. Een `ready` Netlify deploy is daarom niet genoeg bewijs; de deploy moet de huidige recovery bevatten en de publieke route moet de capabilitytokens teruggeven.

## Preventie
Na pricing-wijzigingen controleren we zowel commit/descendant-identiteit als publieke content. Bij een race wordt een governed promotion-successor op de huidige main-epoch gemaakt.
