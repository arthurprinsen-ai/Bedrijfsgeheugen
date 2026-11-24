# BG169 native terminal ancestry evidence

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Obligation: delivery|bg169|exact-provider-ancestry-consumer|20261124-v1

Protected predecessor #6176 fixed the pure terminal guard. The existing BG169 workflow consumer still coerced native comparison behind_by through Number(), so null or malformed provider data could masquerade as zero. This successor validates raw nonnegative integer ancestry, exact native base SHA and zero-behind merge-base/status consistency before constructing the guard payload. Original terminal authority, check ordering, protected squash, expected-head and post-merge proof are unchanged.

Two executable regressions against the actual inline workflow consumer failed on protected source dc04d1f76705d05682048991051a67b098761d62, then passed with the correction. Combined with the existing BG169 transport suite: 5/5. YAML parsed, canonical learning historical replay/shadow/canary all passed locally. Not evidence of an actual prior unsafe merge or complete native auto-merge arbitration. Protected CI and independent production readback remain mandatory.
