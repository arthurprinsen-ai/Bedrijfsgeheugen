# Pricing production readback bounded retry — 24 september 2026

## Probleem
De generieke production routecheck bewees `/prijzen` op dezelfde live deploy, maar de dedicated pricing-verifier kon enkele seconden later binnen één 15s poging geen zichtbare `body` vinden. Daardoor werden lifecycle-, billing- en English-interacties niet eens getest.

## Fix
De pricing-verifier krijgt maximaal twee readiness-pogingen. Iedere poging gebruikt een nieuwe cache-busting nonce en vereist zowel een zichtbare `body` als de attached pricing runtime.

## Fail-closed
De echte interactie-eisen zijn niet versoepeld: geen force-click, geen retry van business-interacties, en na twee readiness failures stopt de readback rood.
