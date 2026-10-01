# Commercial pricing English residual cleanup

Obligation: `commercial-pricing-en-residuals-20261001`

## Change
The English Powerhouse pricing renderer now performs a deterministic final cleanup pass for Dutch residual text that could survive the primary translation map.

## Why
The first English cleanup still left mixed-language phrases such as workshop labels, access labels and delivery copy. The cause was ordered replacement: earlier substitutions changed text so later exact replacements no longer matched.

## Prevention
The renderer now has a terminal residual pass, and regression coverage checks the critical English phrases so mixed-language pricing copy cannot silently return.

## Follow-up hardening
The build composer no longer skips pages that already contain the commercial pricing marker. NL and EN pricing are re-rendered on every build from the canonical catalog, so later translation fixes cannot be bypassed by stale generated markup.
