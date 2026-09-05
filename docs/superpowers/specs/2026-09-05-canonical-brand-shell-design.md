# Canonical Brand Shell Design

## Doel
Bedrijfsgeheugen moet zich technisch en visueel gedragen als één merkproduct. Elke openbare pagina gebruikt exact dezelfde canonical shell. Pagina-specifieke inhoud verandert alleen het relevante component en mag nooit zelfstandig header, menu, trustbar of footer definiëren.

## Architectuurregel
De website bestaat uit twee lagen:

1. **Brand shell** — gedeelde merkcomponenten die sitebreed identiek zijn.
2. **Page composition** — pagina-inhoud en pagina-specifieke componenten die binnen de shell worden geplaatst.

De canonical componentgrenzen zijn:

- `TrustBar`
- `Header`
- `Navigation`
- `MobileMenu`
- `Hero`
- `MainContent`
- `PageTools`
- `CTA`
- `Footer`

`TrustBar`, `Header`, `Navigation`, `MobileMenu` en `Footer` zijn globale singleton-componenten: er bestaat in de broncode precies één canonical implementatie per component. `Hero`, `MainContent`, `PageTools` en `CTA` mogen per pagina verschillen, maar worden via dezelfde componentinterfaces samengesteld.

## Source of truth
De bron van waarheid wordt een componentregister onder `tools/site-shell/`. Geen enkele pagina-builder mag eigen markup voor globale merkcomponenten bevatten.

Voorgestelde structuur:

- `tools/site-shell/components.mjs` — canonical HTML voor TrustBar, Header/Nav/MobileMenu en Footer, plus renderer voor Hero.
- `tools/site-shell/apply-shell.mjs` — assembleert of vervangt alleen de shell-slots rond bestaande pagina-inhoud.
- `tools/site-shell/contracts.mjs` — selectors, slotnamen, publieke pagina-exceptions en invarianten.
- `tools/site-shell/verify-shell.mjs` — post-build regressiegate die alle openbare pagina's controleert.
- `tools/uniforme-schil.mjs` — dunne compatibiliteitswrapper die de nieuwe shell-engine aanroept.
- `tools/normaliseer-site-ui.mjs` — verdwijnt als tweede bron van waarheid; noodzakelijke pricing-only regels verhuizen naar de shell-engine/pagina-policy.

## Slotcontract
Elke gegenereerde pagina krijgt stabiele componentmarkers:

- `data-bg-component="trustbar"`
- `data-bg-component="header"`
- `data-bg-component="mobile-menu"`
- `data-bg-component="hero"`
- `data-bg-component="main"`
- `data-bg-component="page-tools"`
- `data-bg-component="footer"`

De shell-engine vervangt componenten op marker, niet via brede regex over de volledige pagina. Daardoor is een componentwijziging lokaal en voorspelbaar.

## Visuele merkregels
- De navigatie/header gebruikt sitebreed dezelfde donkere marine/blauwe uitvoering als de hoofdwebsite.
- Logo, typografie, afmetingen, menuknop, hover/focus states en mobiele drawer zijn identiek op alle openbare pagina's.
- De trustbar staat direct boven de header.
- Contactgegevens staan alleen in de footer.
- De drie pricing-tools (`Vraag`, `Reken`, `Rol`) bestaan alleen op `/prijzen`.
- De pagina `/prijzen` krijgt geen eigen header, navigatie of menu-CSS meer.
- De mobiele navigatie op `/prijzen` is dezelfde component als elders, geen kopie.

## Component-isolatie
Een wijziging aan bijvoorbeeld `Footer` vereist alleen een wijziging aan de footer-renderer. De build mag alle statische HTML opnieuw genereren, maar de bron-diff en componentcontracten blijven lokaal. Testen verifiëren dat de niet-gewijzigde componenthashes gelijk blijven.

Voor globale componenten wordt per build een deterministische hash berekend uit canonical markup. Iedere openbare pagina moet dezelfde hash dragen voor TrustBar/Header/MobileMenu/Footer. Daardoor kan een afwijkende pagina niet ongemerkt in productie komen.

## Page-specific gedrag
Pagina's leveren alleen een configuratieobject aan, bijvoorbeeld:

```js
{
  slug: '/prijzen',
  hero: { eyebrow: 'Prijzen', title: '...', body: '...' },
  pageTools: 'pricing',
  theme: 'default'
}
```

`pageTools: 'pricing'` is de enige uitzondering voor de prijsinstrumenten. Globale componenten zijn niet overschrijfbaar vanuit page config.

## Migratiestrategie
1. Leg componentmarkers en shellcontract vast met falende tests.
2. Maak canonical componentrenderers op basis van de huidige hoofdwebsite-header/menu/footer.
3. Zet `uniforme-schil.mjs` om naar de nieuwe engine.
4. Trek `/prijzen` door dezelfde engine en verwijder pricing-specifieke menu/header-CSS.
5. Verplaats de laatste normalisatie- en pricing-toolregels naar page policy.
6. Verwijder de dubbele UI-normalizer als bron van globale componenten.
7. Draai post-build verificatie op alle openbare pagina's.
8. Deploy preview, mobiele readback en productie-readback voor `/`, `/prijzen`, `/oplossingen`, `/product`, `/kennis` en `/over-ons`.

## Regressiegates
Een build faalt wanneer:

- een openbare pagina geen canonical TrustBar/Header/MobileMenu/Footer heeft;
- dezelfde globale component op twee pagina's een andere hash heeft;
- `/prijzen` een eigen `bgkop`/pricing-menu-shell of witte header bevat;
- contactgegevens boven de header staan;
- pricing-tools buiten `/prijzen` voorkomen;
- een publieke pagina globale componentmarkup buiten `tools/site-shell/components.mjs` introduceert;
- componentmarkers ontbreken of dubbel voorkomen.

## Niet-doelen
- Geen frameworkmigratie naar React/Vue/Next.
- Geen redesign van alle contentpagina's.
- Geen wijziging van SEO-copy of pakketinhoud tenzij nodig voor shell-integratie.
- Geen runtime componentloader; de site blijft statisch en snel.

## Succescriterium
Een bezoeker kan tussen alle openbare pagina's navigeren zonder verandering in merk-shell, headerhoogte, menu-gedrag of footerstructuur. Een ontwikkelaar kan Header, Menu, Hero of Footer onafhankelijk wijzigen via één componentbron, waarna regressietests bewijzen dat alleen het bedoelde componentcontract is veranderd.
