# 30 oktober 2026 — Canonieke blog 403 en incorrecte CPNL-deadline

- Bron: productie-artifact `run_date=2026-10-29` en `2026-10-30`, beide GENERATED, `approved_at=NULL`, `live_proven_at=NULL`; geen tweede publicatie.
- Provider-authoriteit: RVO CPNL aanvraag 21-04-2026 09:00 t/m 06-10-2026 17:00; op 30-10 tijdelijk gesloten. Oorspronkelijke AI-tekst verwisselde afsluitdatum met verwachte openingsdatum. Herstel: correcte primaire bron vóór publicatie, geen oude gegenereerde claim verspreiden.
- CI fout: GitHub blogrun 40982375638, job 123825250686 en voorganger 40954413989, job 123730648733: Python exporter 403. Edge v240 retourneert correct `BLOG_PUBLIC_EXPORT_NOT_APPROVED`. Dit is een wachtende beslissing, geen toegangsrecht om te omzeilen.
- Oplossing: date-aware original queue/export double quality gate en original Python classify no-op ONLY voor deze exacte 403-body; overige beveiligingsweigeringen fout; geen nieuwe scheduler, geheime token, klantdata of synthetisch publicatiebewijs.
- Regressie: `tests/brain-powerhouse-blog-export-security-contract.test.mjs` plus ongewijzigde doorvoer-security en providercontrole. Skill: `.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md`.
- Bewezen live? Nee; originele beschermd PR, Edge runtime-versies en browserreadback vereist. Uitkomst 29/30 oktober blog blijft GENERATED tot foutvrije inhoud en onafhankelijke toestemming.
