# Canonical closure evidence target

RED target: `tests/brain-chat-learning-canonical-closure.test.mjs` must fail while the new completeness/browser guards are absent from `config/brain-chat-learning-contract.json.canonicalSources`.

GREEN target: after the primary preflight index references those sources, the same regression must pass and BRAIN delivery must be green for the exact head SHA.
