# 2026-09-27 — CONTRACT_CHANGE — MKB Probleemradar signal-to-outcome ownership

- **Fingerprint:** `mkb-problem-radar-signal-to-outcome-v1`
- **Signal:** actuele MKB-scans konden inhoudelijk correct eindigen als melding van een probleem of contentkans, zonder dat de gebruikersuitkomst aantoonde dat BREIN/Powerhouse de vervolgstap bezat.
- **Impact:** de radar kon als nieuwsmonitor aanvoelen in plaats van als commerciële/productmatige sensor; bruikbare signalen konden tussen research en uitvoering blijven hangen.
- **Root cause:** de bestaande closed-loop beschrijving benoemde content/publication/learning, maar maakte report-only completion niet expliciet ongeldig.
- **Final fix:** contract uitgebreid met verplichte SOURCE -> EVIDENCE -> DEDUPE -> PH-Pxxx/CANDIDATE -> PRIORITY -> POWERHOUSE ACTION -> CONTENT/PRODUCT_GAP -> PUBLICATION GATE -> PROVIDER READBACK -> OUTCOME -> LEARNING ownership. Nieuwe preventieregel: `RADAR_REPORT_ONLY_IS_INCOMPLETE`.
- **Owner:** BREIN/Powerhouse Opportunity Intelligence + Content/Growth + Product Intelligence.
- **Regression gate:** bestaande Problem Radar executive historical replay plus Powerhouse Skill Projection; een vervolgtest mag de nieuwe invariant direct machine-enforcen zonder een parallelle radar te introduceren.
- **Verification boundary:** repository candidate moet protected merge en relevante post-merge skill/readback-gates passeren voordat deze contractwijziging als live wordt geclaimd.
- **Rollback/last-known-good:** behoud de bestaande canonical Problem Radar; revert uitsluitend deze contractdelta als hij delivery regressie veroorzaakt.
- **Reusable lesson:** een sensor creëert pas waarde wanneer dezelfde lineage de volgende geldige actie en feedbacklus bezit; rapportage alleen is geen terminale Powerhouse-uitkomst.
