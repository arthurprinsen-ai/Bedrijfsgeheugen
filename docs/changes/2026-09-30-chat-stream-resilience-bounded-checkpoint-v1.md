# Chat stream resilience — bounded checkpoints v1

## Aanleiding
Bij langlopende uitvoering kan de ChatGPT-client een melding tonen als **“Streaming onderbroken. Wachten op het volledige bericht…”**. Dat is een transport/UI-onderbreking en mag geen taakstatus worden.

## Nieuwe permanente regel
Materieel werk wordt opgesplitst in begrensde, hervatbare batches. Voor en na externe side-effects wordt een canoniek checkpoint vastgelegd. Bij reconnect of een nieuwe chat leest de uitvoerende node dat checkpoint, controleert onzekere side-effects via readback en hervat uitsluitend het resterende werk.

## Effect
- geen restart vanaf nul na streamverlies;
- geen dubbele commits/deploys/publicaties door blind replay;
- geen noodzaak voor de gebruiker om opnieuw “ga door” te zeggen;
- minder lange stille toolketens;
- technische polling blijft intern; de chat rapporteert compact en terminal outcome-gebaseerd.

## Grenzen
Dit kan een netwerk- of appstream-onderbreking zelf niet fysiek uitsluiten. De borging voorkomt dat zo'n onderbreking leidt tot verloren werk, dubbele handelingen of een vergeten obligation.
