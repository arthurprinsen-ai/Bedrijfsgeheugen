# Commercial pricing English residual cleanup

Obligation: `commercial-pricing-en-residuals-20261001`

## Change
The English Powerhouse pricing renderer now performs a deterministic final cleanup pass for Dutch residual text that could survive the primary translation map.

## Why
The first English cleanup still left mixed-language phrases such as workshop labels, access labels and delivery copy. The cause was ordered replacement: earlier substitutions changed text so later exact replacements no longer matched.

## Prevention
The renderer now has a terminal residual pass, and regression coverage checks the critical English phrases so mixed-language pricing copy cannot silently return.
## Final root cause correction
The localized English route already contains the pricing marker after route generation. The English composer must therefore rebuild `/en/prijzen` even when that marker is present; only the Dutch canonical route may short-circuit on the marker.
## Terminal normalization
The final English renderer now also normalizes HTML-escaped/partially translated phrases and uses a whitespace-tolerant credit-rule replacement. A fail-closed residual gate prevents known Dutch fragments from reaching the English pricing build.
