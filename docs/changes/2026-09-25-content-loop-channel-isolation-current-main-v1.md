# Content loop channel isolation — current-main replay

## Root cause
The canonical content loop threw a global error when Instagram had no eligible Mira winner or when the Instagram media job was not ready. That prevented unrelated blog and LinkedIn obligations from running.

## Fix
Instagram readiness failures now produce explicit degraded `stepResults` instead of terminating the whole loop. Instagram remains visibly degraded while blog and LinkedIn can continue through their own delivery paths.

## Safety
A failure of the winner-selection RPC itself remains fatal because that indicates a control-plane failure rather than a channel-specific readiness state.
