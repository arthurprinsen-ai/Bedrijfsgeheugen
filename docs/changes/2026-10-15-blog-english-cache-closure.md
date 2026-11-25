# Blog 15 oktober 2026 — 25 exacte EN-vertalingen

De bestaande workflow `Powerhouse daily blog from Supabase` (run `38751766437`) toonde via `STATIC_I18N_CACHE_GAPS_V1` precies 25 ontbrekende Nederlandse strings uit de **bestaande, goedgekeurde openbare webtekst** (titel, meta, H1/H2, paragrafen, FAQ, bronvermelding en korte labels). De vertaalprovider Anthropic gaf HTTP 400 omdat het beschikbare accounttegoed te laag was.

Voor elk van deze 25 exacte bronkeys staat nu een afzonderlijk in natuurlijk Engels geredigeerde vertaling in `config/bg-static-i18n-en.d/powerhouse-blog-2026-10-15.json`. De JSON wordt uitsluitend via het bestaande `loadCache()`-mechanisme gelezen; er zijn geen providercredentials, nieuwe modellen, dubbele executors of browser-externe calls toegevoegd.

De vertalingen behouden originele bedragen (`€3 million`), getallen, datums, officiële namen en links; regelgeving en subsidie worden als **toegeschreven bronclaim** weergegeven, niet als onafhankelijk door de vertaling bewezen recht op subsidie. De oorspronkelijke NL-bronpagina en het bestaande SEO-canonicalproces blijven onveranderd.

Vóór productie blijft de bestaande harde eis gelden: volledige statische EN-cache, gecertificeerde build, protected CI + CodeQL, blog-candidate PR, protected merge en live NL/EN-URL readback. Een cachepatch is op zichzelf geen publicatiebewijs.
