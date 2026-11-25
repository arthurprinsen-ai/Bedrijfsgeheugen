# Agent Fabric: leeradvies is geen bewezen toepassing — 30 oktober 2026

**Menselijke eigenaar:** bestaande ONE BRAIN / Agent Fabric, Social Integration, Reliability en SkillOps. **Incidenten:** [Powerhouse social #4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439), [Self Improvement #4918](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918).

## Wat is vastgesteld?

Het oorspronkelijke `platform/agents/agent-fabric.mjs#suggestLearning` vroeg passende lessen op en riep direct `learningMemory.markReused` aan. Een lookup kon zo zonder enige uitgevoerde actie de hergebruikteller verhogen en `LEARNING_REUSED` uitsturen. Dit overschat de feitelijke adoptie van leerregels. Voor de persoonlijke LinkedIn-OAuth-correctie is wel codebewijs beschikbaar, maar natuurlijke runtime-toepassing van precies die preventieregel was niet afzonderlijk aangetoond.

De productie-Edge `powerhouse-composio-linkedin-setup` v489 heeft de vier correcte OAuth-scopes (`openid/profile/email/w_member_social`); de oorspronkelijke eigenaarstoestemming en onafhankelijke scope-grant zijn afzonderlijk. De persoonlijke post van 29 oktober `PUBLISHED` heeft een echte provider-ID maar `live_proven_at=NULL`, terwijl originele `GET_POST_CONTENT` HTTP 403 geeft. De bestaande post mag niet opnieuw worden verzonden. Deze feiten staan los van de softwarecorrectie hieronder.

## Implementatie binnen de bestaande architectuur

- `suggestLearning` is een leesactie: uitsluitend `LEARNING_SUGGESTED`, geen `reuseCount`-mutatie.
- Nieuwe functie `applyLearning` binnen **dezelfde** Agent Fabric en bestaand `APPLY_LEARNING` Gateway-commando accepteren alleen de geautoriseerde originele natural-run-identiteit, tenant/fingerprint, actor, exacte actie en bronversie.
- De bestaande onafhankelijk gebonden verifier moet echt productie-/providerbewijs uit de oorspronkelijke bron controleren voordat `LEARNING_APPLICATION_VERIFIED` wordt geschreven. De standaard is *fail closed*: zonder verifier blijft de toepassing onbewezen.
- Een in-memory single-flight claim voorkomt dubbele tellingen in hetzelfde proces; dit is **geen** duurzame databasegarantie. De bestaande exclusieve ONE BRAIN-writer moet de sleutel ook bij procesherstarts durabel afdwingen. Er wordt geen tweede store of writer toegevoegd.
- Het bestaande Portal V2 Skills-scherm krijgt een vaste bewijsuitleg zonder statische fictieve status. De bestaande live LinkedIn-readbackkaart blijft leidend voor de 403 en duplicaatstop.
- De twee bestaande SkillOps-vaardigheden ontvangen dezelfde preventieregel, zodat agents onderscheid maken tussen `SUGGESTED`, `APPLICATION_EVIDENCE_DUE` en `APPLIED_VERIFIED`.

## Acceptatie en open verplichtingen

1. Regressietest `tests/brain-agent-learning-application-proof-20261030.test.mjs` bewijst dat een dubbele lookup de teller niet verhoogt, dat ongeldige of ontbrekende externe bewijscontrole wordt geweigerd, en dat alleen exact gepinde run-evidence maximaal één toepassing registreert.
2. Beveiligde PR met Required/BRAIN/CodeQL, systeemkaartcontrole, merge en Netlify productie-readback voor portaalcode. Geen bronwijziging is "live" zonder die keten.
3. Bestaande natuurlijke agentrun schrijft daadwerkelijk `LEARNING_APPLICATION_VERIFIED` via de originele onafhankelijke verifier én de canonieke BRAIN-writer; portaal geeft exacte run + skillversie. Tot dan: **EVIDENCE_DUE**.
4. Nieuwe OAuth-toestemming moet de eigenaar via officiële oorspronkelijke Composio-flow verlenen, gevolgd door originele backendreadback. Geen token kopiëren of toestemming omzeilen.
5. De bestaande post `urn:li:share:7521667096859201536` blijft op `PUBLISHED` tot een onafhankelijk en geautoriseerd bewijs van precies deze bestaande publicatie beschikbaar is. Geen herpublicatie.

**Niet gedaan:** geen nieuwe OAuth-consent, geen fictieve LinkedIn-readback, geen nieuwe scheduler/publisher, geen databasestatus op groen geforceerd, geen claim dat elke agent de preventieregel al toepast.