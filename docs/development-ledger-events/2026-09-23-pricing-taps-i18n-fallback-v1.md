# 2026-09-23 — pricing tap and language recovery

User screenshots proved that rendered controls were not sufficient evidence of interaction correctness. A delegated mobile-safe pricing controller was added. The i18n build contract was also changed so offline releases cannot omit the English route tree while still exposing a language switcher that targets it.

Regression coverage now checks both interaction delegation and offline English-route fallback. Production remains unproven until deployment and public readback complete.
