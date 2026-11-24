# Teksten: leiding, begeerte en eerlijk verlies (hero homepage NL/EN en portaalbegroeting)

Opdracht Arthur 18 nov 2026: alle teksten exclusiever, met leiderschap, begeerte, FOMO en beleving, met aandacht voor SEO-zoekwoorden. Binnen het Rituals-besluit van 17 nov (exclusief door zorg, niet door druk; geen nep-schaarste; korte zinnen, geen uitroeptekens) en het SEO-beleid (`config/seo-optimization-allowlist.json`: marktleider-claims, nep-schaarste en nep-urgentie geblokkeerd; loss-gain-framing toegestaan).

- Leiderschap = de ondernemer houdt de leiding ("Voor ondernemers die de leiding houden", "Hier houd jij de leiding"), geen claim over ons als marktleider.
- FOMO = eerlijk verlies: "Wat vandaag niet wordt vastgelegd, is morgen weg." Geen krapte, geen tellers, geen deadlines.
- SEO: H1, titel en meta ongewijzigd; de hero-tekst noemt nu AFAS, Exact Online en Microsoft 365 (zoekwoorden uit de meta) en behoudt "kennis/onderneming/sturing".
- Wijzigingen: `tools/site-shell/apply-daily-steering-positioning.mjs` (kicker, lead, label, CTA, NL en EN), portaalbegroeting in `assets/rituals-beleving.js`, scriptversie `?v=20261118c`, System Map geregenereerd.
- Tests die de oude tekst vastpinden zijn bewust meegewijzigd; nieuwe test bewaakt eerlijkheid (geen schaarste, geen marktleider, geen uitroeptekens, AFAS aanwezig).
- Niet bewezen: live-readback tot na merge; effect op scrolldiepte of aanmelding (voor/na via meting.js); zoekeffect (te vroeg, titel/meta niet gewijzigd).
- Niet in deze stap: overige pagina's (producten, cases, prijzen, blog), titels/meta, i18n-bestanden voor andere talen.
