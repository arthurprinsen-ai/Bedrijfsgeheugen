# Portal browser-readback recovery: protected trust pages

- Datum: 2026-10-08
- Obligation: `portal-v2-browser-proof-protected-trust-20261008-v1`
- Bewijs: huidige live DOM-test #37823139950 faalt op een demo-call naar `compliance-governance`, terwijl toegang voor anonieme/demo-gebruikers expliciet verboden is; exact dezelfde fout trad op in oude live run #37819188294.
- Failure class: `AUTH_SCOPE_PARITY_MISMATCH`. Geen bewijs van beveiligingslek.
- Fix: strikte anonieme denial, een geïsoleerde synthetic rendering fixture voor enkel UI-pariteit zonder providerclaims, en CSRD native route-ID assertions.
- Verplichte terugval: bij mislukte echte browser readback geen productie-GREEN-status; onderzoekt alleen failure-scope, nooit security-verzwakking.
- Real authenticated customer proof en Source Universe/regulation → tenant-context zijn apart open in #4215.
