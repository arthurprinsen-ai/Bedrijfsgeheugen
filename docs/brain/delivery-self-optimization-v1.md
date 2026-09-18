# Powerhouse delivery self-optimization v1

Fingerprint: `delivery|first-time-right|terminal-preflight|v1`

## Doel

De deliverystraat moet niet alleen veilig zijn, maar preventief werken. Een agent hoort vóór een write, retry, reconcile, merge of promote te voorspellen welke state-verandering de kandidaat waarschijnlijk als volgende ongeldig maakt, en die vermijdbare oorzaak eerst weg te nemen.

## Anticipate-before-act

Voor iedere material transition leest Powerhouse opnieuw:

- actuele `main`;
- PR-head en merge-base;
- ahead/behind en mergeability;
- actieve/terminal workflowstatus;
- writer-lease en overlappende open scopes;
- post-merge deploy/readback/writeback-afhankelijkheden.

Daarna wordt een failure forecast gemaakt voor minimaal de volgende stap: main-drift, scope-collision, hot-surface conflict, metadata/admission mismatch, orphan test/classifier gap, scheduler-capaciteit, deploy/readback-boundary of ontbrekende learning/skill-projection.

Een eerder geldige snapshot is geen autoriteit voor een latere irreversibele actie.

## Pre-CI contract

Voor een material candidate valideert Powerhouse vóór dure workflows:

- `Obligation-ID`;
- `Delivery-Lane`;
- `Candidate-Type`;
- `Base-SHA`;
- bij `TERMINAL_DELIVERY`: owner, scope, exact head, non-owner action en release condition;
- elk nieuw executable testbestand heeft workflow/classifier-dekking;
- machine-readable skill/schema en regressie-assertions zijn onderling consistent.

Dezelfde parser en allowed-value policy als admission zijn de autoriteit. Een chattemplate mag geen afwijkende metadata-dialecten introduceren.

## Scheduler recovery

Een GitHub job met conclusion `cancelled` is niet automatisch een productdefect. Zonder concrete failing assertion:

1. verander geen productcode;
2. hergebruik dezelfde exact-head;
3. retry alleen de ontbrekende/geannuleerde job;
4. behoud succesvolle evidence;
5. pas na een echte assertion-failure wordt code aangepast.

## Moving-main en parallelle agents

Ordinary drift maakt geen nieuwe lineage. Eerst refresh + forecast + same-lineage reconcile. Alleen wanneer de branch materieel divergeert of stale history de veilige landing belemmert, wordt een bounded successor vanaf actuele main gebouwd met expliciete supersession.

Hot shared surfaces worden behandeld als schaarse resources. Agents beperken overlaps, respecteren writer leases en projecteren reusable knowledge bij voorkeur naar een dedicated skill in plaats van tegelijkertijd dezelfde continuity/workflow-file te muteren.

## Terminal-path preflight

Nog vóór codewijziging moet de agent weten hoe dezelfde obligation eindigt:

candidate → exact-head gates → protected merge → deploy → production/main readback → outcome evidence → learning writeback → skill projection/readback.

Ontbreekt een uitvoerbare stap, dan wordt die dependency eerst opgelost of als echte hard boundary geregistreerd. Pending is geen eindantwoord.

## Predictieve optimalisatie

Powerhouse volgt onder andere:

- metadata reject rate;
- orphan test detections;
- scheduler cancellation retries;
- main epoch reconciliations;
- overlap op hot shared surfaces;
- stale-state preventions;
- voorspelde collisions die daadwerkelijk zijn vermeden;
- pre-CI contract defects;
- duplicate-lineage preventions;
- forecast false positives en forecast misses;
- verhouding hergebruikte groene gates;
- terminal lead time.

De forecast wordt dus zelf gekalibreerd. Een voorspelling zonder outcome wordt geen kennis; een miss wordt een nieuwe prevention-rule.

## Relatie tot bestaande guards

Deze learning vervangt `delivery|merge-epoch|optimistic-cas|v1`, terminal-claim proof en no-pending delivery niet. Zij vormen samen één keten:

- merge-epoch guard beschermt de landing;
- no-pending houdt ownership vast;
- terminal proof bepaalt wanneer LIVE bewezen is;
- self-optimization voorspelt en voorkomt de frictie vóór die controls hoeven in te grijpen.


## Production proof

PR #2114 is protected gemerged op `main`.

- candidate head: `87ac4eb16ae5e78ac54f45603f06b5086858c80c`
- merge SHA: `f76bfbbccbc6dd256590dad1e95bc75985d9a351`
- Required, Unified BRAIN en CodeQL: success
- main readback: verified

De optimization learning is daarmee bewezen actief op production/main.
