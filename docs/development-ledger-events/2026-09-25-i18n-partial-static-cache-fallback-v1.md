# 2026-09-25 — i18n partial static cache fallback

- Incident: production browser readback faalde op `English route still shows the Dutch pricing H1`.
- Production identity en pricing content waren al groen; de failure zat uitsluitend in de Engelse route-uitvoer.
- Root cause: één ontbrekende static translation schakelde de volledige Engelse translation map uit.
- Repair: cached translations blijven altijd actief; alleen ontbrekende refs gebruiken runtime fallback.
- Regression: `tests/brain-static-i18n-production-fallback-v1.test.mjs`.
- Terminal bewijs blijft: protected merge → exact-main deploy → production pricing/i18n browser readback.
