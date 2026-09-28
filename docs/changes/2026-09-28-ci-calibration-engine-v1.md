# CI Calibration Engine v1

## Doel

Powerhouse CI Intelligence mat al wachttijd, uitvoertijd, fan-out, failures en cancellations. Vanaf nu vertaalt dezelfde dagelijkse run die metingen ook naar een machineleesbaar calibration-plan.

## Werking

De calibrator beoordeelt onder andere:
- queue p95;
- execution p95;
- workflow fan-out per SHA;
- failure rate;
- cancellation rate.

Bij overschrijding van begrensde thresholds ontstaan aanbevelingen zoals lagere preview-paralleliteit, minder auxiliary fan-out, strakkere impact-routing of meer gewicht voor Pattern Memory.

## Guardrails

De calibrator werkt in `SHADOW_RECOMMENDATIONS`:
- geen directe repository-write;
- geen automatische merge;
- Required, CodeQL, security en production readback mogen nooit worden omzeild;
- eventuele toekomstige configuratiewijzigingen moeten via de bestaande protected candidate/writer-keten.

Zo ontstaat telemetry → recommendation → protected change → outcome → nieuwe telemetry, zonder een tweede control plane.
