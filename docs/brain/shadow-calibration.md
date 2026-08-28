# Shadow Brain calibration

Every shadow Decision records an expectation before the outcome is known. Calibration compares expected vs actual business value and cost, classifies over/underprediction, and distinguishes useful action, correct wait, false positive and missed opportunity.

Causal confidence controls learning weight: HIGH evidence may strongly inform a Challenger; MEDIUM is partial evidence; LOW stays weak. Calibration never mutates the production policy directly. Weight changes remain Challenger evidence until replay, shadow, canary and protected-metric gates pass.
