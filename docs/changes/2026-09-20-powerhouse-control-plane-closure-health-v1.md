# Powerhouse control-plane closure health v1

The ONE BRAIN health surface now follows the active reconciliation worker v2 instead of a retired v1 scheduler identity. Terminal closure also recognizes a closed-unmerged superseded migration only when its stable name resolves unambiguously to a migration already present on current main.

This prevents false RED health from scheduler-name drift and prevents historical supersession metadata from permanently blocking terminal evidence while preserving fail-closed migration identity checks.
