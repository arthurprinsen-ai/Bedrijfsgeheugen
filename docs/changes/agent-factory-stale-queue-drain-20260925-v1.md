# Parallel agents: snellere GitHub queue-drainage

Powerhouse scheidt stale GitHub Actions cleanup nu van de volledige repository-janitor. Daardoor kan een probleem in PR-hygiene of terminal-leaseherstel de runnerqueue niet langer als enige schoonmaakroute blokkeren.

Daarnaast is `lane-website.yml` de enige automatische zware PR-route voor V18/canonical-shell build, preview, SEO en browserverificatie. De oude V18 promotion en canonical full build zijn expliciete recovery/diagnostic workflows; live shell readback blijft een main/production check.

Resultaat: minder duplicate fan-out, snellere beschikbaarheid van runners en behoud van fail-closed terminal delivery.

De canonical website lane neemt ook de SEO-estate regressies over die eerder alleen via de losse full-build workflow liepen; testdekking blijft daardoor volledig.
