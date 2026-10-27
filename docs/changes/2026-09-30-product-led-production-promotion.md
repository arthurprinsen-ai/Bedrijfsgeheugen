# Product-led production promotion recovery — 30 september 2026

De product-led Powerhouse-homepage was al gemerged, maar Netlify-productie liep nog achter op protected main.

Deze recovery triggert bewust een verse Netlify-build vanuit dezelfde protected-main lineage. De terminale controle is pas groen als de productie-release de nieuwe lineage bevat en de publieke homepage de drie productlijnen toont: Powerhouse Intelligence, Powerhouse Agents en Powerhouse Connect.

Root cause confirmed: the Netlify build ran `apply-product-led-home.mjs`, which still referenced the retired `prototype-v18-stable.html`. The premerge parity build did not execute that step, so it could not catch the failure. The recovery removes the obsolete target and adds the product-led step to premerge parity.
