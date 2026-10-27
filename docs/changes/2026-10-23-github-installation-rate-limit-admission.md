# GitHub installation-rate limit: fail closed with useful diagnosis

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661

On a real seven-stage innovation candidate [#4763](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4763), protected admission failed at 2026-10-23T10:42:32Z on a GitHub installation-scoped rate limit HTTP 403. Prior fallback marked it `CONTROL_PLANE_ADMISSION_ERROR`, which could be confused with a malformed PR or permanent authority rejection.

The original workflow now imports a **pure** classification module. Installation rate limit/secondary limit/HTTP 429 emits `CONTROL_PLANE_RATE_LIMITED`, stable fingerprint and defers to the **existing** bounded watchdog after actual budget reset. It does not retry rate-limited reads immediately, authorize CI bypass or write GitHub statuses. A normal unauthorized 403 stays a control-plane error; 502/503/504 transport errors retain the short pre-existing retry policy. No API calls added.

The original Required, CodeQL, canonical Brain learning, closure, exact SHA, writer lease, and tenant/security checks remain mandatory. Diagnostics do not claim the blocked candidate passed or that provider capacity has been restored.

Regression: `node --test tests/brain-ci-installation-rate-limit-classifier-v1.test.mjs`. Only exact-head Required and CodeQL plus protected merge and independent real admission/readback can prove runtime adoption.

Official docs: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
