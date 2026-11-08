# Blog translations: second reading — 2026-11-08

## Problem
The 6 Nov repair patch contains hand-made English translations that were only checked for key coverage.

## Change
A second reading of all 338 entries (automatic model reviewer) found 21 clear errors, now corrected in `config/bg-static-i18n-en.d/blog-markdown-repair-2026-11-06.json` (values only, keys unchanged): MT -> management team, an untranslated source title, play time -> exercise duration, structural -> regular, refund -> reversal, IT responsible -> person responsible for IT.

## Not changed
No keys, tests or other files. The nonsensical Dutch source sentence 'Eigentijdige eigenaar' stays as translated ('Responsible owner').

## Known limit
The reviewer was an automatic model, not a human and not the governed OpenAI route; stylistic choices were left alone. Not proven live until readback.
