# Bedrijfslek final build authority recovery

Fingerprint: `growth|bedrijfslek|final-build-authority|v1`

Production reached the correct merged SHA but functional readback showed that historical V18 generators had restored the old homepage CTA and the old six-question selfscan. The fix makes the standalone Bedrijfslek page authoritative, scopes homepage conversion verification to the real `view-home`, and adds fail-closed final-artifact assertions.

Terminal success requires the live homepage to route value-first to Bedrijfslek and live `/zelfscan` to expose the ungated Bedrijfslek result path.
