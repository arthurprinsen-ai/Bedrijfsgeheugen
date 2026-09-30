# AI Modelwijzer v2 delivery classification recovery

Date: 2026-09-30  
Fingerprint: `powerhouse|ai-modelwijzer-v2|delivery-classification|v1`

## Root cause
The expanded 103-model Modelwijzer reached `main`, but the production readback control plane still treated its new public page families and canonical model catalog as unclassified paths. That stopped the release before a current-main deployment could be proven.

## Repair
The website delivery lane now explicitly owns the Modelwijzer root, provider pages, comparison pages and `data/ai-model-catalog-v1.json`. A Brain regression replays the complete path set and requires a single website delivery lane.

No content, scoring or model data is downgraded by this recovery. The current main Modelwijzer remains authoritative.

## CI coverage repair
The existing advisor and SEO-cluster regression files are now executed by the existing Powerhouse Daily Self Evolution workflow, so committed Modelwijzer tests cannot silently exist outside CI coverage.
