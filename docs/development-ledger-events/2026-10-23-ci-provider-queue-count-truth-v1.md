# 2026-10-23 — Providerwachtrij heeft bewijswaarde, geen nul-fallback

- **Eigenaar:** bestaande Powerhouse predictive CI-controller, issue #4661
- **Fingerprint:** `delivery|predictive-lane-capacity|invalid-provider-queue-counts-failclosed|20261023-v1`
- **Oorzaak:** `Number(value)||0` behandelde ongeldige, negatieve, niet-integrale en `null` providerwachtrijtellingen als vrije capaciteit.
- **Herstel:** strikte niet-negatieve veilige-integercontrole van queued, inProgress, pending, waiting, requested en projectedNewRuns. Afwijkingen activeren de al bestaande `PROVIDER_QUEUE_SNAPSHOT_INCONSISTENT`-hold en blokkeren kandidaatmutaties. Alleen onafhankelijke read-only werkzaamheden mogen doorgaan.
- **Bewijs:** regressiereplay voor `null`, numerieke strings, onbeschikbare waarden, negatieve/fractionele waarden, `Infinity` en `NaN` plus geldig integerpad.
- **Canoniek behoud:** bestaande #4655 provider-ghost-classifier, #4661 CI-eigenaar, protected Required, CodeQL, Netlify, geen tweede scheduler/queue en geen omzeilde branch protection.
- **Acceptatie:** exacte branch-HEAD tests, beveiligde auto-merge en finale provider-readback. Nieuwe toestand is CANDIDATE; geen geclaimde snelheidstoename of livegang.
