# Original i18n failure — governed wrapper taxonomy missing

- **Date:** 2026-11-18
- **Parent P0:** #4215; combined ONE BRAIN/Powerhouse/Heartbeat P0 #4198
- **Original incident fingerprint:** `netlify|production-i18n-translate|http-502|20261022-v1`
- **Observed production after PR #5991:** exact main Netlify READY deploy `6afd4b4ef39e5fbbc0ab1a0d`, real public-word request ID `34858`, HTTP502, native Netlify request `01M7PQ6WB0N4RH2JKAF59X6A46`, class `TRANSLATION_RUNTIME_OR_SHAPE`, upstream status null. 07:01–07:02 UTC further 502.
- **Confirmed diagnostic root cause in source:** original governed production AI wraps provider exception as `AI provider failed safely: ...` before original classifier sees it; previous classifier matched only a leading OpenAI provider marker.
- **Candidate:** literal-prefix-only unwrap in classifier; parse whitelisted numeric HTTP and known output codes; never log raw detail or bypass governance
- **Regression:** `tests/brain-i18n-translation-diagnostics-v1.test.mjs`
- **Terminal:** NOT GREEN until protected exact Netlify release and fresh request/status, actual translation success, original Brain/Heartbeat ACK.
