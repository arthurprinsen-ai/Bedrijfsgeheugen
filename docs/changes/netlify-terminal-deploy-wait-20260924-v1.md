# 2026-09-24 — Netlify terminal deploy wait v1

Fingerprint: `netlify-terminal-deploy-wait-v1`

## Probleem
De Production Source Snapshot startte de Netlify MCP-deploy met `--no-wait`. Daardoor kon de transportstap groen worden terwijl Netlify nog bouwde of nog niet naar productie had gepromoveerd. De latere exacte-SHA-readback zag dan alleen dat productie nog achterliep en verloor provider-terminal diagnostiek.

## Oplossing
De production snapshot wacht voortaan op het terminale Netlify-deployresultaat. Pas daarna volgen:
1. exacte `release.json` SHA/context/deploy-id;
2. pricing production-content proof;
3. browser-interactieproof voor pricing en NL→EN.

## Preventie
Provider-side-effect accepted/started is nooit gelijk aan deployment success. Een productieclaim vereist provider-terminal completion plus onafhankelijke production readback.
