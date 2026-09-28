# CI Calibration → Autonomous Optimizer advisory handoff v1

CI Calibration blijft read-only. De dagelijkse Autonomous Engineering Optimizer leest voortaan de calibration-sectie uit hetzelfde CI Intelligence rapport.

High-priority calibration recommendations fungeren uitsluitend als veiligheidsveto op méér parallelisme of méér speculatie. Ze kunnen geen tuningwaarde rechtstreeks zetten. Downward/defensive tuning blijft uitsluitend afgeleid uit de gemeten metrics en alle persistente wijzigingen blijven beperkt tot de bestaande tuning-allowlist via een protected PR.

Daarmee vormen CI Intelligence → Calibration → Autonomous Optimizer één feedbacklus zonder een tweede mutation authority te creëren.
