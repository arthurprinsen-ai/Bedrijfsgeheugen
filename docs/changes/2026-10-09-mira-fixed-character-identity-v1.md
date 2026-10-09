# Mira blijft dezelfde persoon in ieder Instagram-beeld

9 oktober 2026 — P0 #4198, fingerprint `mira-master-two-image-face-continuity-v1`.

De bestaande canonieke fictieve OpenArt-referentie is `Yjqu4D7v76HABNPmQPj1` (1728×2304). OpenArt metadata bevestigt de asset en in eerdere echte image2video-generaties is dezelfde oorspronkelijke afbeelding als reference aangetroffen.

**Structurele runtimecorrectie:** niet langer tevreden zijn met `mira_present` voor een willekeurige vrouw. Bij ieder te publiceren beeld worden de exacte pixels én de originele masterafbeelding samen aan de goedgekeurde vision-verifier gegeven; de uitkomst moet `face_identity_match=true` met confidence ≥0,94 hebben. Voor Reels gelden drie afzonderlijke succesvolle checks op exact start-, midden- en eindframe, met één masterhash; bij drift, onvoldoende beeld, verkeerde referentie of onbereikbare master afwijzen. Kleding, scène en expressie mogen variëren; gezicht en herkenbare leeftijd niet.

De bestaande router verlangt bij video de echte OpenArt-master als `image2video` input en een nieuwe history-ID. Alleen `miraFaceProofValid` plus bestaande scene/caption/exact media SHA/temporal proof gaan door naar de enige bestaande Instagram publisher. De bestaande publicatieautorisatie wordt niet verruimd; geen nieuwe scheduler, geen alternatieve Meta-account en geen duplicate send.

**Bewijsgrens:** een geslaagde CI, merged source en werkende Edge deployment bewijzen de infrastructuur. Een video van vandaag is pas gepubliceerd bij exact Instagram-media-ID en onafhankelijke readback. Het systeem kan een generatief model niet tot pixelidentieke uitvoer dwingen, maar kan afwijkende output weigeren.
