# Website cross-browser CLS and interaction repair v1

The first full structural browser baseline covered 247 public sitemap routes, 592 render checks and 24 interaction checks. It exposed 73 failures, dominated by 42 CLS failures plus stale interaction assumptions.

The shared repair removes avoidable first-paint header shifts by rendering the desktop language control in the canonical header before JavaScript and by giving the mobile Menu control its final markup and geometry from the initial HTML/CSS. The assurance now targets the canonical /product route, uses the actual mobile/menu/language controls, records CLS source nodes, and tests the exact Netlify candidate preview on pull requests before merge.

The CLS threshold remains unchanged. Structural mismatch must be repaired rather than hidden by tolerance widening.
