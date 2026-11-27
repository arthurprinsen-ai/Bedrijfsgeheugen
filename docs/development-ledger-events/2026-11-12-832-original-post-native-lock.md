# 12 Nov 2026 — Native already applied 832 source lock recovery

Original author: Supabase Git integration; 832 native applied, 831 source-locked. Verified exact SQL statements (whitespace normalized) from protected post source release. Repair only provider-applied source history, never mark subsequent identity revision repair as applied. Protected CI and readback required. Original P0 #4198 remains OPEN with producer bug `OBLIGATION_IDENTITY_IMMUTABLE`.
