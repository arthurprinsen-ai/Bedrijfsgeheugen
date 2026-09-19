# Terminal readback descendant fallback

Terminal closure no longer starts a needless recovery loop solely because the first canonical production readback completed unsuccessfully. Canonical success remains the preferred path. A failed, cancelled or unavailable canonical readback now falls through to the existing live descendant-containment proof.

The fallback remains fail-closed: the live production release SHA must contain the merge, the production contract must be BG169/BRAIN-DELIVERY-v2, connector readiness must be valid and a production deploy identity must exist before terminal success can be recorded.
