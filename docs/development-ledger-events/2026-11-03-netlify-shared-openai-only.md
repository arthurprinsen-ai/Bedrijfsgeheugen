# 2026-11-03 — Original shared Netlify Brain OpenAI migration
- Source: owner OpenAI-only directive, original canonical incident #4198.
- Source risk: three customer-facing routes used old Anthropic Sonnet/Haiku via shared adapter and wrappers.
- Source change: original Netlify shared adapter OpenAI GPT-5-mini; original explicit source, data sovereignty, tenant and usage gates preserved; no new route or scheduler.
- Replay: tests/brain-netlify-shared-openai-only-20261103.test.mjs and existing usage/i18n tests updated for actual OpenAI provider response.
- Protected PR candidate not deployed, exact-head Required/BRAIN/CodeQL and Netlify original build pending.
- Next original owner: Netlify runtime OPENAI_API_KEY presence, protected merge, Netlify exact SHA/route provider readback; DPA proof and rest of provider inventory remain OPEN.
