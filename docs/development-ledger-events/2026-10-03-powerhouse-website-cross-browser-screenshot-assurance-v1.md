# Website cross-browser screenshot assurance — closure — 3 oktober 2026

Obligation: `website-cross-browser-screenshot-assurance-20261003-v1`

The public website quality gate is now a canonical website-lane capability:
- every sitemap route receives Chromium mobile + desktop responsive/render checks;
- representative route families receive full-page screenshots in Chromium, Firefox and WebKit at mobile, tablet and desktop sizes;
- navigation and language interactions are exercised;
- failures retain screenshots and JSON evidence;
- the production check runs daily.

The workflow, contract and Brain regression are explicitly classified in the website delivery lane. This closes the activity-ledger/writeback requirement missing from the initial merge.

Recovery metadata refresh: predecessor is already merged; this recovery remains the same obligation and does not use a Supersedes pointer.
