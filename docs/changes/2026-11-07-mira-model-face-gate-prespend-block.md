# Mira: geen credits meer uitgeven aan een model dat de gezichtscontrole al faalde

Op 7 november kostte een Veo 3.1-Reel 280 credits en haalde het gezicht 0,900 (vereist 0,940). Dezelfde score had Veo al op 3 november. De preflight keek alleen naar het formaat en niet naar eerdere meetresultaten.

Wijziging: `assessMiraProviderBeforeSpend` kent nu `MIRA_MODEL_FACE_EVIDENCE`. Een model/modus met een beste gemeten gezichtsscore onder 0,940 geeft `MIRA_MODEL_FACE_GATE_FAILED_BEFORE` en de preflight antwoordt 422. Er is geen manier om dit via de aanroep te omzeilen; een model komt pas terug na een gereviewde bronwijziging met nieuw gemeten bewijs.

Drempels, budget en publisher blijven gelijk. Echt effect pas zichtbaar bij de volgende natuurlijke run zonder verspilde generatie.
