# Supabase productie-attestatie: tijdelijke 401 ≠ definitief ongeldig token (14 november 2026)

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232 — samenhang met commerciële Gmail / originele Mira, issue #4198.

## Feitelijke productieoorzaak

Na protected merge #5778 (commit 898a89d61317b18e61491b8f3c83119a28e81b8d) faalde bestaande Supabase Edge Production Authority run 43607583476. De read-only providerbron-downloads van de eerste drie functies waren gelukt; de vierde gaf een enkele HTTP 401 `Invalid access token`. De oude workflow concludeerde direct `SUPABASE_ACCESS_TOKEN_INVALID_REAUTH_REQUIRED`, hoewel niet aantoonbaar was dat de gehele credentialsessie permanent ongeldig was. De **originele GitHub-workflow** is eenmaal opnieuw uitgevoerd: die sloot af met success. De echte Edge functie `powerhouse-content-loop` is v874, en alle negen runtime-bronbestanden kwamen exact overeen met de beschermde main-bron. Oorzaakklasse: incidentele provider-/credential-readbackfout die onterecht als definitief werd geclassificeerd; de exacte externe oorzaak is onbekend.

## Bestaande executor behouden

Alleen dezelfde read-only function-download in de oorspronkelijke `.github/workflows/supabase-edge-production-authority.yml` krijgt maximaal drie pogingen als én alleen als de werkelijke CLI-uitvoer `Error status 401` of `Invalid access token` bevat. Bij succes gaat dezelfde protected attestatie verder met bestaande byte-voor-byte broncontrole. Bij drie 401-fouten stopt alleen de attestatie met exit 78 en een expliciet security-owner signaal. Bij non-auth providerproblemen blijft de bestaande begrensde convergence van kracht. Geen nieuwe cron, GitHub-workflow, Supabase-deployer, e-mailzender of Instagram-mediafallback; geen versoepeling van auth, geheimen, duplicate gate, face-test, ontvanger toestemming of provider-ID readback.

Agentrollen `agent-security` en `agent-social-delivery-recovery`, bestaande skill, `AGENTS.md`, regressietest en ONE BRAIN learning verwijzen naar hetzelfde herstelcontract.

## Vier harde acceptatiebewijzen

1. Regressie: normale download 1 poging, incidentele 401 -> tweede poging succes, drie blijvende 401s -> exit 78, non-auth 503 -> originele bounded convergence.
2. GitHub Required + CodeQL + branch protection voor deze nieuwe PR groen en merged naar main.
3. De originele `Supabase Edge Production Authority` op protected main veilig gestart met expliciete bestaande function slug; job succesvol met echt providerbronbewijs en zonder extern deploymentrecht.
4. Instagram/Gmail dagelijkse provideractiviteit blijft **apart** OPEN totdat echte externe provider-ID en onafhankelijke readback, originele ONE BRAIN consumer ACK en Heartbeat-uitkomst bestaan. Een succesvolle releasecontrole is geen dagelijkse post of e-mail.
