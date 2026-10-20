# 2026-10-20 — email learning scoped refresh

Obligation-ID: powerhouse|email-learning-scoped-refresh|20261020
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4478
Base-SHA: 2c37555d4f8654202a2a06d521df6604a11abc0a

Observed production 503 request 8678 and exact LEARNING_REFRESH unqualified-delete guard failure. Source definition fingerprint f9ff58f839c1233ffd1b85fa4e86ec73. Original PostgreSQL regression failed EMAIL_LEARNING_FOREIGN_OWNER_LOSS. Candidate passed source aggregation, foreign-owner preservation, repeated refresh, expired window and original-source retention. CLI generated migration 20261020162730, then allocated monotonically as 20261020174501 after the observed current-main maximum 20261020174500. No production DDL or provider sends performed during construction. Native preview, protected exact-head gates and production reply-loop readback remain acceptance conditions, recorded on the incident rather than predeclared successful here.
