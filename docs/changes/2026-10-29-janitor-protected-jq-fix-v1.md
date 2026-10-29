# Janitor leest protected zonder jq-valkuil (2026-10-29)

De sweep-tellers toonden seen=219, protected=219, deleted=0. Oorzaak: `.protected // true` maakt van `false` in jq weer `true`, dus geen enkele branch was ooit verwijderbaar. Beide verwijderpaden lezen nu `if .protected == false then "false" else "true" end`. Een test draait jq op letterlijke false, true en ontbrekend.
