# Make data transfer governor runtime proof

Production completion requires all of the following on the same governed revision:

1. repository required `test` is green;
2. BG82/BG159/BG162/PH14 fresh readback shows the intended mappings and intact connections;
3. no critical producer is disabled by the governor;
4. one bounded synthetic or read-only canary proves classification without waste;
5. if Make is executable, one material event proves BG211 -> BG205 -> BG168/BG166 -> BG167; otherwise a single deduplicated replay obligation remains open;
6. no success claim based only on save/config state.
