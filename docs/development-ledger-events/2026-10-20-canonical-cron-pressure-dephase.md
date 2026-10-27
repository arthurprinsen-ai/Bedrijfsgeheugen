# #4215 existing-cron pressure dephase — execution ledger

Date: 2026-10-20
Obligation-ID: portal|canonical-cron-pressure-dephase|20261020
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Baseline main: b89503291db89263b75c65743eab5a13665bdd1b
Status: REVIEW_CANDIDATE; NOT_LIVE

Live provider-backed inventory: #46 hourly :52 shares #129; #130 hourly :12 shares #116 commercial stages. Main runtime scheduler #171 and identity #138 active. Live two exact portal indexes absent; broad Postgres startup and statement timeouts observed. No migration is claimed applied.

Implementation: exact-command-guarded, idempotent `cron.alter_job(schedule)` migration for #46->:55 and #130->:45, retains all owners and every existing job command, with regression, Brain learning and human change audit.

Release gates: protected Required and CodeQL, migration preview, protected merge, production runtime readback, post-release timeout comparison, production sort-index migration condition verification, signed portal HTTP 200 and two isolated tenants. No cosmetic GREEN.
