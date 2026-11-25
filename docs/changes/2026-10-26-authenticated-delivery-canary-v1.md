# Authenticated release dashboard canary

The existing administrator-only Delivery & bewijs view reconciles the authorized observability response, three `deriveReleaseStatus` values, provider identities and the actual DOM stage values. Missing provider evidence or stage mismatch is marked **incomplete**. No authentication bypass or public debug route is introduced. A true production canary pass requires an existing legitimate administrator to log in, receive an authorized API response and open the delivery tab.
