# Buffer 429 recovery must preserve external identity
A transport rate limit is not proof that an external side effect did not occur. After Buffer acknowledges creation, Powerhouse now stores the provider post id before any readback. If readback receives 429, the same item is reconciled later; it is never recreated blindly.

The cooldown is bounded from Retry-After and applies only to Buffer-backed LinkedIn lanes. Instagram remains independent under the Mira/Composio publication authority.

This prevents duplicate posts while keeping recovery autonomous and idempotent. Production success remains evidence-based: protected merge, deployed function and provider/runtime readback are required.
