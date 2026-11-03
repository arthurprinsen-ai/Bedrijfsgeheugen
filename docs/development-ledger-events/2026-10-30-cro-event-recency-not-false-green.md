# Development event ledger — 30 oktober 2026 — CRO recency truth
- Fingerprint: `powerhouse|cro|event-recency-hidden-under-healthy-minute-drain|20261030-v1`.
- Trigger: De originele CRO-view bevatte een `last_persisted_event_at`, maar originele portaalkaart labelde deze niet als `occurred_at` en maakte de versheid niet zichtbaar. Technisch gezonde drain-HTTP204 mag niet als bewijs van verse events of gekwalificeerde conversie worden gelezen.
- Readback: echte historische eventbron `2026-10-30T02:20:34.179Z`; originele `powerhouse_cro_conversion_evidence_v1` had ~4.410 page-eventobservaties, 0 CTA. Geen bewijs van actuele echte CTA-oproep, storingsschuld of betaald resultaat.
- Verantwoordelijke: bestaande Powerhouse Growth/SEO CRO + ONE BRAIN/Heartbeat + bestaande Portal V2.
- Herstel: oorspronkelijk CRO-endpoint projecteert pure event-recency en fail-closed quality; bestaande `Andere data` laat tijd en bewijsgrenzen zien. Geen nieuwe scheduler, writer, route, database of tracking.
- Test: `tests/brain-cro-event-recency-proof-20261030.test.mjs`; `brain/learning/2026-10-30-cro-event-recency-not-false-green-v1.json`.
- Status bij creatie: SOURCE_CANDIDATE, niet LIVE totdat protected gate, main, exacte Netlify/Supabase/browserreadback bewezen zijn. Geen verleende menselijk OAuth/consent, geen productieresultaat of gerealiseerde order gefabriceerd.
- Nasleep: verifieer via bestaande echte event-ID/providerweg; eerst meten, dan experimentele hypothese en onafhankelijke bedrijfsuitkomst, daarna werkelijk toegepaste Brain-skill.
