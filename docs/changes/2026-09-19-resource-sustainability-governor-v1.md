# Resource & Sustainability Governor

Powerhouse now treats resource efficiency as a system invariant rather than an optional optimization.

For material work, agents and chats must evaluate expected platform usage before execution, choose the lowest-resource safe route, and record measurable usage after execution. The shared policy covers Supabase, Netlify, Notion, GitHub, Composio, OpenArt and Placid and is designed so future platforms inherit the same rules before receiving production authority.

The decision order is reuse → cache/readback → dedupe → batch → incremental/delta → smallest capable model/tool → cheap preflight → execute once → verify once → learn.

Correctness, security, privacy, evidence and verified outcomes remain stronger constraints than cost reduction. CO2, energy and water are reported as measured only when provider evidence exists; otherwise Powerhouse records clearly labelled proxies or unknown values.

This change is part of obligation `BG-RESOURCE-SUSTAINABILITY-20260919-01` and must pass the normal protected delivery and production-readback chain before it is considered live.
