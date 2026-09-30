# AI Modelwijzer v2 terminal recovery — 30 september 2026

## Root cause
De AI Modelwijzer v2 was inhoudelijk gemerged, maar productie was niet terminal groen. De statische EN-build is fail-closed en miste vertaalcache voor de nieuwe Modelwijzer-copy. Daarnaast bestond een oudere governance-recovery met nuttige maar nog niet geïntegreerde provider/deployment-governance en quality-surface borging.

## Geconsolideerde fix
- volledige bestaande Modelwijzer i18n-cache + v2-filter/governance-cache;
- 103 modellen / 10 providerfamilies blijven de modelauthority;
- aparte provider/deployment-governancecatalogus met opslag, inferentie, training, retentie, ZDR, CMK, private networking, self-host en sovereignty level;
- advisor gebruikt die governancecatalogus daadwerkelijk voor aanbevelingen;
- harde filters voor Zero Data Retention en customer-controlled deployment;
- provider-governance zichtbaar in de publieke Modelwijzer;
- leadfunctie geregistreerd in het quality-surface contract;
- AI Modelwijzer geregistreerd in website delivery classification;
- contextuele inbound links vanaf AI-adoptie, AI-ecosysteem en data-soevereiniteit;
- alle nieuwe SEO-pagina's gebruiken absolute https://www.bedrijfsgeheugen.nl/... hrefs;
- canonical learning + skill + System Map + regressietests bijgewerkt.

## Delivery
Deze recovery supersedeert PR #3389. De unieke, nog geldige governancewijzigingen uit PR #3386 zijn in deze lineage geïntegreerd; de oudere 30-modelcatalogus uit die PR is bewust niet overgenomen.
