# Website assurance mode wiring v1

The canonical website cross-browser screenshot assurance now passes its execution mode explicitly from GitHub Actions into the runner.

- Pull requests: bounded all-route mobile sweep against the exact Netlify deploy-preview, plus the full critical Chromium/Firefox/WebKit screenshot matrix.
- Scheduled production: all sitemap routes on mobile and desktop, plus the full critical cross-browser matrix.
- Evidence remains fail-closed and screenshots are retained for 30 days.
