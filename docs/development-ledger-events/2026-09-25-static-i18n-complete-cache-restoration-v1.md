# 2026-09-25 — static i18n complete cache restoration

Observed:
- protected main before recovery: `760d23c1d0369c0b21b574083daf3354d1a0ae20`;
- committed base cache blob: `63d4e10854c4ddbfa1300fbb5186d8392ec7abfd`;
- proven complete cache blob: `0be053e028cc3d8a78c1e3391397e35072a7050c`;
- exact offline localization reproduction failed with 1,926 missing translations;
- production browser proof reported the Dutch pricing H1 on the English route.

Action:
- restore the proven complete cache blob on a fresh branch from current main;
- retain canonical pricing H1 patch fragments;
- add regression, Brain learning and human documentation;
- require protected merge → exact-main deploy → production browser roundtrip before terminal closure.
