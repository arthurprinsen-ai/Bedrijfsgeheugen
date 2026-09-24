# Login noindex utility-route scope — 24 september 2026

De loginroute is bewust noindex en hoort niet in sitemap/indexeerbare SEO-scope. De technische SEO-validator verwierp echter alle interne links naar /inloggen zodra die route uit de indexeerbare inventory werd gehaald.

De structurele fix is een expliciete utility-routecategorie: bereikbaar en geldig als interne bestemming, maar bewust niet indexeerbaar. Onbekende niet-indexeerbare bestemmingen blijven fouten.

Regression: `tests/brain-seo-login-noindex-scope-v1.test.mjs`.
