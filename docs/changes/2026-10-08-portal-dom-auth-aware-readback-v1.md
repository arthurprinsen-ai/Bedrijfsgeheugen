# Portal V2 anonymous readback authorization correction

Production DOM readback on `adc19513` failed on protected `compliance-governance`. Existing `page-shell.js` correctly rejects anonymous and demo sessions. Test assertions must require fail-closed for protected pages, while still asserting native rendering for accessible pages. This change does not loosen customer authorization or modify runtime. CSRD visual failure and authenticated tenant proof remain open in #4215.
