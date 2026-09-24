# Production retry na pricing parse-fix — 24 september 2026

De vorige Netlify-build bereikte de provider maar faalde door een JavaScript parse error. PR #2763 repareerde die fout en borgde syntaxchecks voor alle Node-scripts in de Netlify-buildcommand.

Deze release wijzigt geen applicatiegedrag; hij triggert opnieuw de canonical Production Source Snapshot vanaf de gecorrigeerde protected main.

Terminal succes blijft: provider-ready + exacte release.json SHA/context/deploy-id + productie-browserreadback.
