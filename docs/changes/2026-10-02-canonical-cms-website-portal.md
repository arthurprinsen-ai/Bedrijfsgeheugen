# Wijziging: centraal CMS voor website en portaal

Website en portaal krijgen één canonieke CMS-laag bovenop de bestaande Supabase/Powerhouse-authority. Teksten, links, afbeeldingen, metadata, navigatie, prijzen, CTA's, zichtbaarheid en andere beheerbare elementen kunnen per surface, taal, route en gebied worden vastgelegd.

Het CMS gebruikt drafts, expliciet publiceren, archiveren en immutable revisies. Publieke pagina's lezen uitsluitend gepubliceerde content via een read-only gateway; de beheerroute gebruikt de bestaande admin-identiteit. Bestaande HTML en portal-renderers blijven de structurele bron totdat een element expliciet aan een CMS-key is gekoppeld.

De beheerpagina `/cms.html` is bewust uitgesloten van publieke website-shell-, sitemap- en SEO-projectie, zodat de admin-interface niet door de publicatiebuild wordt herschreven.
