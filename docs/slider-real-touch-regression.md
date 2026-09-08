# Comparison slider real-touch regression

The site-wide comparison slider must be owned by one canonical runtime. On mobile touch and desktop pointer input, the divider must physically reach 0% and 100%: fully left reveals only the white after-panel; fully right reveals only the blue before-panel. Legacy slider listeners must not be able to clamp or overwrite the canonical split state.
