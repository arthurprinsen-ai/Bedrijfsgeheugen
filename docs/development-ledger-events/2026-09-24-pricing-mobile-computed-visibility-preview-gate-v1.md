# 2026-09-24 — Pricing mobile computed visibility

- Failure run: `36020379517`
- Live SHA: `945febc5cb2d603dfaefcc8b1d12a36b075a7d1d`
- Live deploy: `6ab5417a7533790008782b04`
- Failure: lifecycle tab present in DOM but not clickable/visible on 390 px
- Prevention: mobile computed visibility hardening + exact deploy-preview pricing/English interaction gate
- Closure requires: preview proof → protected merge → exact production deploy → production pricing/English proof
