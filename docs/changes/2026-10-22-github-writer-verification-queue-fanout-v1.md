# 22 oktober 2026 — GitHub Actions writer-triggerfanout beperken

**Obligation:** `github-actions|writer-workflow-run-fanout|20261022-v1`  
**Incident fingerprint:** `github-actions|required-test-completion|unrelated-writer-verification-fanout|20261022-v1`  
**Existing incident for orphaned GitHub records:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4655

Een directe GitHub Actions-controle toonde 38 queued runs en 12 actieve runs. `Repository Writer Operational Verification` werd door iedere voltooide `Required test` gestart, terwijl alle writer-jobs uitsluitend `verify/**`, `verify-cheap/**` en `verify-parity/**` PR-branches bedienen. Dat veroorzaakt onnodige vervolg-runs voor gewone `fix/**` PR's.

De minimale codecorrectie beperkt de `workflow_run`-eventfilter tot deze writer-proofbranches. De jobinterne verificaties, exacte PR-concurrentie, Required test, CodeQL, de canonieke scheduler en alle authorisatie blijven ongewijzigd. `tests/brain-writer-verification-trigger-scope-20261022.test.mjs` voorkomt regressie.

**Belangrijke afbakening:** vier runs van 7 oktober bleven `queued` zonder jobs; reguliere annulering en force-cancel leveren ieder HTTP 409, delete voor één run HTTP 403. GitHub moet hun providerstatus reconciliëren. Dit is geen bewijs van runnertekort; deze PR herstelt die oude records niet. De wijziging is kandidaat, niet live, totdat protected CI/CodeQL slagen, de commit op main staat en nieuwe triggers zijn geverifieerd.
