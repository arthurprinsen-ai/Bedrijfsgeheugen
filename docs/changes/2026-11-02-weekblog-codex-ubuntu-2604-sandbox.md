# Weekblog originele Codex-action — Ubuntu 26.04 D-Bus sandboxtoegang

Datum: 2 november 2026. Live oorspronkelijke fout: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41451022810, job 125295966048, stap `Artikel schrijven`.

## Situatie, oorzaak en gevolg

Het officiële GitHub-runnerlog meldt Ubuntu 26.04.1 (image `ubuntu-26.04`); de pinned `openai/codex-action@bdf19a4a223ec2549a3e2274a0cf61556bc07675` koos `safety-strategy: drop-sudo` en `permission-profile: ":workspace"`. Nog voordat artikelgeneratie kon beginnen, faalde de privilegevermindering: `Could not restrict access to /run/dbus/system_bus_socket`. Daardoor bestaat geen gevalideerd blogartefact van die uitvoering. Dit is géén bewijs van onvoldoende OpenAI-credits, inhoudelijke fout of redactionele afkeuring.

De upstream Codex-actionissue https://github.com/openai/codex-action/issues/188 beschrijft deze runner-afhankelijke weigering exact en noemt Ubuntu 24.04 als compatibele runner. De oplossing mag NOOIT `safety-strategy: unsafe`, een uitgeschakelde sandbox of een onbeveiligde hoofdtakpush zijn.

## Gerichte broncorrectie binnen oorspronkelijke uitvoerders

De bestaande en enige weekblog- en blog-update-workflow behouden hun naam, triggers, shared `repo-schrijven` concurrency, pinned Codex-action, `drop-sudo` en `:workspace` en alle bestaande Notion/SEO, writerlease, deterministische contentcontract- en protected PR-poorten. Alleen `runs-on: ubuntu-latest` gaat naar `ubuntu-24.04` voor beide Codex-uitvoerende jobs. Verder: originele CMS-redactionele expliciete goedkeuring, onafhankelijke Netlify-productiereadback en publieke URL blijven apart vereist; geen directe verzendbevoegdheid en geen extra scheduler.

## Testen, borging, bewijsgrens en herhaling

Regressie `tests/brain-blog-codex-hosted-sandbox-20261102.test.mjs` eist de beide pinned runnerklassen, ongewijzigde action security en original candidate-PR-only writer; bestaande provider- en writebacktesten blijven verplicht. De originele CMS Editorial Studio skill is bijgewerkt, machine-les en append-only ledger volgen. ONE BRAIN-fingerprint `powerhouse|blog|codex-action-ubuntu26-dbus-sandbox|20261102-v1`, historisch OBSERVED; pas VALIDATED na bron- en CI-readback en PROVEN pas als een echte volgende uitvoering article/artifact goedkeuring/levering bewijst. Een uitrol is geen klantwaarde, betaalde order, e-mail, LinkedInpost of liveblog.
