# ONE BRAIN portaal: 0 testfouten zichtbaar, zonder vals groen

**Oorzaak** — de bestaande originele `brainBackendRun`-projectie was nog hardcoded `BRAIN_BACKEND_FAILED`, zelfs nadat het canonieke register een nieuwe, onafhankelijke GitHub BRAIN-run met nul failures bevatte. Dit veroorzaakte een misleidende portaalstatus.

**Bronbewijs** — origineel GitHub BRAIN run 41430758451, backendjob 125229059857: 5.392 totaal, 5.390 geslaagd, 0 mislukt, 2 overgeslagen; protected main 79d99ce9d03068dae3c909707d00dde1933f9d78; Netlify deploy 6ae8689d8166870bb317e761 READY met exacte commit. CAS-register versie 10 bevat `software_recovery_20261102` onder originele fingerprint.

**Correctie** — de originele eigenaar-only read-only API gebruikt hetzelfde register en toont bij een intern consistent nieuw bewijs `BRAIN_BACKEND_ZERO_RECORDED_NONTERMINAL`, 0 en de volledige GitHub-runlink. `verifiedPassed` en natuurlijke geen-herhaling blijven false totdat de oorspronkelijke providercheck onafhankelijk in de portaalruntime is herhaald. Een nieuwere echte FAILED_BRAIN wint boven oude nul. Geen dubbele meting, writer, scheduler, nieuwe omzetclaim of publicatie.

**Preventie** — exacte totaalsom, niet-null zero, geldige SHA/deploy, monotone runvolgorde, historisch falen bewaard, generieke business-RED onafhankelijk. Toets in oorspronkelijke BRAIN, Required, CodeQL; pas na protected merge en Netlify owner-only readback live. Incident niet PROVEN zonder volgende natuurlijke uitvoering.
