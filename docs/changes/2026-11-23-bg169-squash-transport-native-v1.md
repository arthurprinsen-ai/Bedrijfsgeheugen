# BG169: GitHub-native squash-transport en exacte productie-identiteit

**Datum:** 23 november 2026. **Oorspronkelijke autoriteit:** BG169 `Unified Brain Delivery`. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Echt waargenomen defect
De oorspronkelijke release https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45144449592 had een volledige brongebonden run: kandidaatidentiteit, security admission, planning, backend lane, pre-handoff en terminal-guard geslaagd (`TERMINAL_MERGE_ADMITTED`). De echte GitHub-provider blokkeerde de laatste actie: **`Merge commits are not allowed on this repository (HTTP 405)`**. De repository heeft `squashMergeAllowed=true`, `mergeCommitAllowed=false`, `rebaseMergeAllowed=false`. Dat is geen reden om GitHub-branchbeveiliging uit te zetten.

## Correctie binnen dezelfde autoriteit
De bestaande `.github/workflows/unified-brain-delivery.yml` controleert de feitelijke GitHub-repositoryinstelling, voert uitsluitend een toegestane `squash`-merge uit en bewaart alle oorspronkelijke SHA-, same-repo-, niet-draft-, protected-main-, terminal lease-, reviewer-, Required- en CodeQL-gates. Na de provideractie bevestigt de workflow de door GitHub geretourneerde merge SHA als voorouder van `main`, dezelfde SHA in de gemergede PR en exacte **Git-tree-equivalentie** met de geteste kandidaat; een squash kan immers geen commit-voorouderrelatie met de oorspronkelijke HEAD bieden. De volledige bronboom mag niet onbedoeld veranderen. De evidence ontvangt `merge_method` en `merged_sha`.

## Foutpreventie, test en afronding
Het brongebonden regressiebestand `tests/brain-bg169-squash-transport-20261123.test.mjs` maakt de merge-policy en de brongetrouwe readback afdwingbaar, met de bestaande Brain-learning en dit menselijk dossier. Er is géén schaduw-release, directe main-write, uitgezette beveiliging of ontbrekende productiepost achteraf als groen geregistreerd.

**Acceptatie:** exact-head Required + CodeQL, onafhankelijke oorspronkelijke BG169 release met het nieuwe beleid, GitHub provider merge-SHA+tree-check, Netlify/Supabase voor werkelijk veranderde runtime en named ONE BRAIN/Heartbeat verwerking. Tot dan `SOURCE_CANDIDATE_NOT_LIVE`.
