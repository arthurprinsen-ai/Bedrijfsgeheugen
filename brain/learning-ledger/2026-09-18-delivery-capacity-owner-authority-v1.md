# Delivery capacity & owner authority learning

Datum: 2026-09-18  
Type: LEARNING / SCHEDULING / AUTHORITY / PREVENTION  
Fingerprint: `delivery|capacity-owner-authority|v1`

## Wat Powerhouse hiervan leert

Drie verschillende delivery-toestanden moeten expliciet uit elkaar blijven:

1. **Backpressure** — `WAITING_CAPACITY` / `FINISH_EXISTING_WORK_FIRST` betekent dat bestaande terminale delivery eerst af moet. Dit is geen productdefect.
2. **Serialization** — `BLOCKED_PROMOTION_SERIALIZATION` is terecht wanneer meerdere echte promotions tegelijk proberen te landen. Alleen aantoonbare Candidate-Type-misclassificatie mag worden gecorrigeerd.
3. **Owner-head authority** — zodra de canonical owner dezelfde obligation naar een nieuwere exact-head brengt, zijn oudere heads en hun groene runs alleen audit-evidence. Merge-authoriteit verschuift naar de nieuwste owner head.

## Preventieregels

- mutatie is verboden als enige aanleiding capacity backpressure is;
- Candidate-Type wordt vóór CI semantisch gevalideerd;
- promotion serialization wordt nooit omzeild via metadata-truc;
- nieuwste canonical owner head wint;
- actieve owner branch niet force-updaten zolang die aantoonbaar vooruitgaat;
- start dure terminale CI pas als capaciteit en owner-conflictrisico acceptabel zijn.

## Meetpunten

`capacity_backpressure_count`, `promotion_serialization_block_count`, `candidate_type_reclassification_count`, `owner_head_supersession_count`, `writer_head_thrash_avoided_count`.

Deze signalen voeden de bestaande delivery self-optimization skill zodat Powerhouse minder reactief en meer scheduling-aware wordt.
