# Blogpublicatie — geen blokkade meer door één vertaalprovider

## Geobserveerd probleem
De Powerhouse-bloggenerator leverde voor 19 oktober een Nederlandstalig artikel op, maar de bestaande **Powerhouse daily blog from Supabase** GitHub-workflow (`39208299296`) stopte in het voorbereiden van verplichte Engelstalige cacheteksten. Anthropic antwoordde met `HTTP 400 credit balance is too low`. Dat is een externe providerafhankelijkheid, niet het ontbreken van een publicatie-idee. De publicatie moet terecht geblokkeerd blijven zolang Engelse productiepagina's niet volledig vertaald en geverifieerd zijn.

## Concrete herstelwijziging
De bestaande code en workflow krijgen uitsluitend voor de netwerkgestuurde vertaalklaarzetting een tweede geautoriseerde transportkeuze: OpenAI Responses met de bestaande `OPENAI_API_KEY`. De voorkeursprovider blijft Anthropic zolang die functioneert. Bij aantoonbaar billing- of autorisatiefalen, of een ontbrekende Anthropic-key, kan OpenAI complete batches produceren via strikt gestructureerde JSON. We controleren exact aantal strings, lege waarden, URLs en variabele placeholders voordat iets in de versioned i18n-cache wordt opgeslagen.

De normale Netlify-productiebuild behoudt `STATIC_I18N_NETWORK=0` en `STATIC_I18N_REQUIRE_CACHE=1`; ontbrekende vertalingen blijven een harde fout. Het programma verstuurt geen posts of e-mails en omzeilt geen Required CI, CodeQL, PR-merge of provider/productie-readback.

## Controle en acceptatie
- Contracttest: `tests/brain-blog-approved-translation-provider-failover-20261019.test.mjs`, samen met bestaande `brain-blog-i18n-credit-fail-fast` en productie-i18n-tests.
- Bevestig dat de GitHub-Actions-secret `OPENAI_API_KEY` werkelijk beschikbaar is voor het beschermde blogworkflowpad (niet afleiden uit een aanwezige variabelenaam).
- Vereist: groene Required CI en CodeQL, beschermde merge, één geslaagde blogvoorbereidingsrun met `STATIC_I18N_PREPARE_COMPLETE`, provider-gecontroleerde Netlify-uitrol en publieke `/blog/<slug>/`-readback.
- Tot die laatste controle is dit een **kandidaat**, geen bewezen live-publicatie.

Bron: [misgelopen Powerhouse-blogrun](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39208299296).
