# Homepage toggle browser stability

The protected browser lane twice failed on the homepage Platform/Expertise toggle because Playwright's automatic scroll placed the target under sticky/floating UI.

The browser contract now recenters each tab, waits briefly for layout stability, and retries the same real pointer click up to three times. It deliberately does not use `force: true`, so a genuine user-facing overlay defect still fails the gate.
