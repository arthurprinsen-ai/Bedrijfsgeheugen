# Powerhouse delivery capacity & owner authority v1

Fingerprint: `delivery|capacity-owner-authority|v1`

## Doel

Voorkomen dat Powerhouse geldige control-plane backpressure, promotion-serialization of owner-head movement verkeerd interpreteert als codefailure.

## Capacity semantics

`WAITING_CAPACITY` en `FINISH_EXISTING_WORK_FIRST` betekenen dat de delivery-control-plane bewust nieuwe terminale work terughoudt. Correct gedrag is: bestaande terminale owner laten afronden, state blijven refreshen en de wachtende obligation hervatten zodra capaciteit vrijkomt.

## Candidate-Type semantics

`Candidate-Type` is gedragsbepalend:

- `promotion`: echte promotion/transport naar terminale delivery;
- `implementation`: code/learning/feature implementatie;
- `recovery`: herstel van een bestaande delivery-lineage.

Een fout label corrigeren is toegestaan. Een echte promotion als implementation labelen om serialization te omzeilen is verboden.

## Owner-head authority

Voor één obligation kan slechts één actuele owner head merge-authoriteit hebben. Wanneer de canonical owner naar een nieuwe SHA gaat:

- oudere CI blijft bruikbaar als audit-historie;
- oudere green evidence autoriseert geen merge meer;
- andere chats/agents volgen de nieuwste owner head;
- geen force-update door een tweede actor zolang de owner aantoonbaar vooruitgaat.

## Scheduling-optimalisatie

Powerhouse gebruikt capacity- en owner-signalen om te beslissen wanneer duur terminal werk zinvol is. Daarmee verschuift de architectuur van reactief retryen naar conflict- en queuebewuste planning.
