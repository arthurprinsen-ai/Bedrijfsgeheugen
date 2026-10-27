# Website cross-browser screenshot assurance v1

Powerhouse now verifies the public website in two layers:

1. Every sitemap route is rendered in Chromium on mobile and desktop and checked for HTTP/rendering, visible main/H1, text presence, horizontal overflow, broken images, CLS, page errors and failed document/script/stylesheet requests.
2. A representative cross-section of route families is captured as full-page screenshots in Chromium, Firefox and WebKit on mobile, tablet and desktop. Critical navigation/language interactions are exercised as part of the same run.

The job runs on relevant pull requests and daily against production. Failures retain screenshots + report artifacts for 30 days. Threshold widening is not an acceptable repair for a structural layout problem.

## Delivery closure
The workflow, contract, runner and Brain regression are explicitly classified in the website delivery lane. The corresponding development-ledger event is mandatory closure evidence for this capability.
