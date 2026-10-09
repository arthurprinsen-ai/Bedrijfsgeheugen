# P0 #4215 engineering event — runtime-equivalent production visual readback

- Date: 2026-10-09
- Obligation-ID: `p0-4215-runtime-equivalent-production-readback-20261009-v1`
- Root cause: Netlify intentionally omits builds for changes restricted to CI/doc/test/learning, while the existing DOM verifier required exact newest main SHA even when deployed Portal V2 runtime had not changed.
- Actual production base: `7048fa85accbae9305324d9c9aec40d1a0ab9ea9`; current main before repair: `13243deb1c3efc4f76af363916c5c5ffb3c295c2`. GitHub comparison proved the interval had only workflows, tests, docs and learning files.
- Conservative solution: manual source PR #4240 plus complete GitHub compare proof that no runtime file changed; pin immutable published ancestor and require strict existing browser visual comparison.
- Existing authority retained: one Portal V2 production DOM workflow, GitHub protected merge provenance, Netlify provider and Playwright. No duplicate scheduler/deploy, authentication bypass or fabricated customer proof.
- Regression: `node --test tests/brain-p0-4215-runtime-equivalent-production-v1.test.mjs`.
- Completion evidence: protected exact-head Required, CodeQL, merge, production runtime SHA and successful terminal manual DOM run with screenshots. Parent P0 remains open for other independent acceptance.
