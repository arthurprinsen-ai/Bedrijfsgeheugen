# SEO money-page live release: Twinfield API intent op bestaande eigenaar

Deze release bevat alleen een veilig, omkeerbaar deel van de oorspronkelijke SEO-overdrachtsherstel-PR #5591. Supabase Preview weigerde de gecombineerde PR in de provider-previewomgeving met `Remote migration versions not found in local migrations directory`. De bestaande Supabase source- en migratiecontroles zijn NIET uitgeschakeld: de backend-consumerwijziging blijft fail-closed in #5591.

Exacte bestaande website-eigenaar `https://www.bedrijfsgeheugen.nl/twinfield-koppeling` krijgt de commerciële zoekwoordvariant `twinfield api` in de bestaande NL-locale SEO-map (geen nieuwe money URL of concurrerende blog). De oorspronkelijke SEO-bronkaart en Supabase-projectie blijven volledig gelijk; hun gezamenlijke aliasaanpassing hoort uitsluitend bij backend-PR #5591. HTML-titel en meta-/OG-description worden sterker afgestemd op API-koppelingen en probleem/foutpreventie. Public canonical en Frisse Blik CTA blijven ongewijzigd. Drie nieuwe letterlijke NL-bronteksten zijn vertaald met de bestaande source-locked EN-static cache; geen online buildvertaling of omzeiling.

Deze broncandidate moet via normale GitHub Required, CodeQL, volledige Netlify build + public deploy/readback live voordat dit onderdeel wordt afgesloten. Niet geclaimd: ranking-/CTR-stijging, conversie, causal experiment of omzet. De aparte oorspronkelijke SEO-resolver websitehandoff in #5591 blijft EVIDENCE_DUE zolang de native Supabase preview niet onafhankelijk groen is. Geen nieuw cron/publisher, geen centrale log duplicatie.

Bron: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
