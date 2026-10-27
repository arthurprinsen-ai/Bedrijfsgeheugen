# 2026-09-30 — Independent public-browser readback

Obligation: independent-public-browser-readback-2026-09-30.

Readback targets:
- https://www.bedrijfsgeheugen.nl/sitemap.xml
- https://www.bedrijfsgeheugen.nl/ai-modelwijzer
- https://www.bedrijfsgeheugen.nl/en/ai-modelwijzer

Independent external readback succeeded through ZenRows even though the default browser provider could not connect.

Observed:
- sitemap: NL + EN Modelwijzer present with reciprocal nl/en/x-default hreflang;
- NL Modelwijzer: correct lang, canonical, hreflang, title, description and keyword;
- EN Modelwijzer raw HTML: correct canonical SEO title;
- EN Modelwijzer JS-rendered state: title overwritten by legacy bg-tabtitel script.

Action: strip the legacy dynamic title script from static localized pages and make independent-browser fallback a permanent production-truth rule.
