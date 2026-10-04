# Website cross-browser assurance — settled navigation recovery

The website assurance runner now reconciles failed document requests against the final successful navigation. A transient retry such as `document:/:net::ERR_CONNECTION_RESET` no longer keeps a route red when that same pathname subsequently loads successfully.

This is deliberately narrow: script and stylesheet failures remain hard failures, unrelated document failures remain visible, and no failure is suppressed when the final HTTP response is unsuccessful. Visual thresholds, CLS limits, browser coverage and screenshot coverage are unchanged.
