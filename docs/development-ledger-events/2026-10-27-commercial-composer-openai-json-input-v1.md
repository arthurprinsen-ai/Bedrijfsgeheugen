# 2026-10-27 — Commerciële composer: json-input

- Root cause: OpenAI 400 omdat de input het woord JSON niet bevat bij json_object.
- Bestaande composer aangepast (één regel). Geen nieuwe route of scheduler.
- Test: `tests/commercial-composer-openai-json-input-20261027.test.mjs`.
