# Powerhouse Session Binding v1

## Doel
`POWERHOUSE-SESSION-BINDING-v1` sluit het gat tussen **Powerhouse-context kennen** en **daadwerkelijk onder Powerhouse-governance draaien**.

Een materiële chat, agent of workflow is pas governed wanneer een actuele `POWERHOUSE-PREFLIGHT-RECEIPT-v1` is aangemaakt vanuit de bestaande mandatory preflight. Memory, gesprekshistorie of losse instructietekst zijn nooit voldoende bewijs van governance.

## Harde invariant
`NO_MATERIAL_POWERHOUSE_EXECUTION_WITHOUT_VERIFIED_SESSION_BINDING`.

Startup wordt:

`canonical preflight -> authority resolve -> session receipt -> execute -> prove -> writeback -> universal completion`

De bestaande Brain/current-state, policies, evidence, obligations en learning stores blijven authority. Session binding maakt geen nieuwe store en bewaart geen alternatieve waarheid.

## Receipt
Een receipt bindt minimaal:
- `sessionId` en `runId`;
- observatietijd;
- digest van canonical preflight/current-state projection;
- digest van het volledige preflight packet;
- policyversies;
- authority snapshot;
- open-obligation snapshot;
- execution class;
- candidate identity wanneer beschikbaar;
- eigen integrity digest.

Een receipt wordt ongeldig wanneer run/candidate niet overeenkomt, integrity faalt of de verwachte canonical-state digest veranderd is. Bij materiële state/policy/obligation/candidate-wijziging of herstel na interruption moet opnieuw worden gebonden.

## Authority resolver
Voor iedere voorgenomen goedkeuringsvraag wordt eerst authority geresolved.

Bestaande architectuur, Powerhouse operating rules, LIVE & BEWEZEN delivery, canonical writeback/documentatie, veilige implementatiedetails en reeds geautoriseerde voortzetting leiden tot `CONTINUE_AUTONOMOUSLY`. De agent mag daarvoor niet opnieuw vragen of het ontwerp akkoord is.

Alleen een bewezen nieuwe human-authority boundary mag `ASK_USER` opleveren: secrets/credentials, nieuwe of ruimere permissions, security-control weakening, destructieve/onherroepelijke data, nieuwe/verhoogde betaalde externe resources, juridisch/financieel bindende handeling of een werkelijk nieuwe product/architectuurkeuze die niet uit canonical authority of veilige defaults kan worden afgeleid.

## Completion-koppeling
`POWERHOUSE-UNIVERSAL-COMPLETION-v1` accepteert geen terminale status zonder een geldige matching receipt. Ook Agent Fabric completion gebruikt dezelfde receipt-validatie. Daardoor kan een unbound chat/agent niet achteraf als `LIVE & BEWEZEN` of `Resolved` worden aangemerkt.

## Enforcement boundary
De repository kan de native ChatGPT-app niet dwingen om vóór iedere losse algemene conversatie code uit deze repository uit te voeren. Daarom is de technisch bewijsbare scope: iedere **materiële Powerhouse-uitvoering die via de Powerhouse runtime/delivery/completion authority loopt**. Context-only chats zijn expliciet `POWERHOUSE_UNBOUND` en hun output is geen governed completion-evidence totdat zij via het bootstrap/preflight-pad zijn gebonden.

## Regressie
De regressiesuite bewijst minimaal:
- context zonder READY preflight kan niet binden;
- receipt drift/mismatch faalt gesloten;
- bestaande authority blokkeert herhaalde akkoordvragen;
- hard boundaries mogen wel `ASK_USER` opleveren;
- Universal Completion faalt zonder matching receipt;
- Agent Fabric kan niet terminaliseren zonder receipt;
- Shared Agent Memory CI voert de session-binding tests uit.
