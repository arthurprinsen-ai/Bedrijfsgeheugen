# Mobiele header, leesbaarheid en popup

Datum: 15 oktober 2026. Dit is een **wijzigingskandidaat** zolang Required CI, CodeQL, beschermde merge en productie-readback niet aantoonbaar zijn afgerond.

## Wat verandert?
De merknaam staat op mobiele schermen zonder geel driestreep-pictogram dat op een tweede menuknop lijkt. Rechts blijft één toegankelijke navigatieknop van minimaal 48×48px met zichtbare toetsenbordfocus bestaan. De hoge bovenste trust-bar verdwijnt op telefoons. De homepagekop gebruikt een leesbare, begrensde lettergrootte; de benadrukte woorden zijn geel zonder onleesbaar geel blok onder witte letters. De videohero van de platformpagina wordt compacter en leesbaar. De na 4,2 seconden verschijnende vaste zoektijd-popup wordt op mobiele schermen verborgen, zodat inhoud, primaire CTA en WhatsApp niet afgedekt worden.

## Waar en hoe verifiëren?
De wijzigingen zitten in de gedeelde laatste website-stylesheet `assets/site-coherence-v1.css`, gepubliceerd met de versioned asset query `?v=20261015-mobile1`. De bronpagina's / en /product en de Engelse/overige V18-pagina's vereisen na Netlify-publicatie een visuele controle bij iPhonebreedtes 375 en 430px. De menuknop moet blijven werken, uitklapnavigatie scrollbaar, kop zichtbaar en CTA's bereikbaar. Testcontract: `tests/site-shell-mobile-first-fold.test.mjs`.

## Aannames en grenzen
De inspectie van live HTML plus screenshots bevestigt de symptomen; een geslaagde fysieke iPhone-readback van de nieuwe versie is **nog niet bevestigd**. De oplossing verandert geen backendprocessen of gebruikerstoestemming.
