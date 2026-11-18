# 2026-11-18 — Mira: eenmalige, aan de eigenaar gebonden vierde verificatie

De 18-nov Mira-video is volledig gegenereerd (OpenArt history `r6sZX8kdGyvpD6zEbWg7`) en bewaard. De drie begrensde verificaties faalden toen de visionprovider geen tegoed had; het tegoed is inmiddels hersteld. Het contract eiste daarna expliciete eigenaarsbeoordeling, maar de planner had geen pad om die vast te leggen.

De planner accepteert nu precies één extra verificatie, uitsluitend met `asset_manifest.owner_review_extra_verification` gebonden aan dezelfde job-id en history-id (`approved_by=arthur`, `extra_attempts=1`, datum, `approval_ref`, `no_regeneration=true`). Een `FAILED`-verplichting is alleen met dat record geschikt, en het maximum wordt vier en is niet vernieuwbaar. Geen nieuwe video, geen andere verifier, geen wijziging in de 0,940-gezichtsdrempel of de Meta-publisher. Dit is geen Instagram-publicatie: daarvoor blijft een echte gezichts- en temporele proef plus een Meta-provider-ID met onafhankelijke GET vereist.

Regressie: `tests/brain-mira-original-exact-video-provider-retry.test.mjs`. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
