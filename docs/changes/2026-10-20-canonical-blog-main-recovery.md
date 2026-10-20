# 20 oktober 2026 — canonieke blog herstellen zonder duplicaten

De originele dagelijkse blog [PR #4518](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4518) bevatte één uit de productiedatabase afkomstige `content_ready` publicatie over kennisverlies en personeelstekort. De branch liep tientallen commits achter op `main` en mocht niet worden geforceerd, aangezien `blog/index.html`, `blog/rss.xml` en `sitemap.xml` ondertussen wijzigden.

Deze scope neemt exact het bestaande Nederlandstalige artikel en de Engelse statische woordenschat over; voor de drie indexbestanden is alleen de gerichte artikelverwijzing toegevoegd. Geen nieuw AI-contentartefact, geen tweede publicatie, geen overschrijven van andere blogitems en geen wijziging aan de commerciële executor.

Acceptatie: unieke blogverwijzing in index, GUID in RSS en URL in sitemap, bijbehorende bestaande artikelpagina en vertalingen, een regressietest en beschermde Required CI/CodeQL; pas na exact productie-SHA en HTTP200 publieke URL geldt `LIVE_PROVEN`. Andere kanalen en incident #4215 blijven onafhankelijk.
