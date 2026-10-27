# Portal V2 production readback recovery

Netlify is no longer the blocker for Portal V2. Production deploy `6abe4c249f07cb0008e14578` is ready on exact merged SHA `4a4f1f3d8deb9aed23b0a168dd0140b04dce803d`.

This change updates the browser verification to match the new navigation contract:
- the left sidebar is the one canonical general navigation;
- child pages keep their parent group active and show that group as page context;
- the removed duplicate inner navigation is not expected anymore;
- immutable production navigation gets one bounded retry to avoid false failures from a single slow document navigation.

It also makes the Netlify recovery learning record canonical by pointing historical replay at executable repository tests.
