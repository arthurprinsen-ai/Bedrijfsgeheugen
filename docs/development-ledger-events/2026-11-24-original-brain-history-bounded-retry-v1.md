# Original BRAIN history bounded provider retry

Original terminal run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45467060405 stopped after `unexpected end of JSON input` and `TERMINAL_BRAIN_PROVIDER_HISTORY_UNVERIFIED`. Historical failure preserved. Both original full-history readers now retry a transient transport/parse/partial result at most three times, with per-read timeout and bounded backoff. Search cap and invalid exact identity/cutoff remain fatal. Neither dispatch nor acceptance can use incomplete history; the original exact BRAIN result, protected source and all other gates remain mandatory. Regression executes actual shell retry blocks against interrupted, malformed, incomplete and cap-saturated responses. No extra scheduler or verifier. Production proof requires protected merge and actual terminal readback.

Existing delivery owner. No new scheduler.
