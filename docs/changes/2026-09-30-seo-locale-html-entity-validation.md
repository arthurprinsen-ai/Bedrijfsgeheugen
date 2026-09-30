# SEO locale validator — HTML entities

De productiebuild faalde ten onrechte op Engelse SEO-titels en keyword clusters met een ampersand. De HTML was correct (`&amp;`), maar de validator vergeleek de geserialiseerde representatie letterlijk met de semantische bronwaarde (`&`). De validator decodeert nu HTML entities vóór vergelijking. Daardoor blijft echte metadata-drift fail-closed, zonder correcte HTML af te keuren.
