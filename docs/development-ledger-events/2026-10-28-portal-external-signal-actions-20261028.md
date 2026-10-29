# Ledger event: portal externe signalen als contextuele acties

- Datum: 2026-10-28
- Event: `portal_external_signal_actions_v1`
- Branch: `feat/portaal-externe-signalen-context-20261028`
- Scope: portal-v2 (bevindingen, contextuele kaarten, kaartweergave)
- Schrijver: alleen bestaande portaal-renderlaag; geen nieuwe scheduler, publisher of tabel
- Waarheid: branch-test, niet live; geen productie-readback
- Invariant: externe kaart zonder eigen klantdata bestaat niet; elke kaart draagt bron, peildatum en reden; geen verzonnen bedrag
- Bewijs: portal-v2 suite 662/662; nieuwe tests 11 + 4 groen
