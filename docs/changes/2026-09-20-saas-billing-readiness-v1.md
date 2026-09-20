# SaaS billing readiness

Online SaaS checkout has two independent external requirements: the Stripe API secret used to create subscription Checkout sessions and the Stripe webhook secret used to authenticate lifecycle events.

Bedrijfsgeheugen now treats these together as one readiness contract. Self-service availability is true only when both are configured. This prevents a partial setup where a payment can start but subscription provisioning cannot be trusted, or vice versa.

The safe readiness endpoint returns only:
- provider
- selfServeAvailable
- state

It never returns environment variable names, secret presence details or secret values.
