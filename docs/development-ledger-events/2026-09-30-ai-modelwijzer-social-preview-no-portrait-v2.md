# 2026-09-30 — AI Modelwijzer social-preview herstel

Obligation: ai-modelwijzer-social-preview-no-portrait-v2-2026-09-30.

Root cause: undersized social metadata image allowed LinkedIn crawler fallback to another page/site image.

Action: force Bedrijfsgeheugen company banner as the only explicit social preview image for AI Modelwijzer; add cache busting and regression coverage.

Target: https://www.bedrijfsgeheugen.nl/ai-modelwijzer
