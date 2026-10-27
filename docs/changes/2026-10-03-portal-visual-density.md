# Portal visual density

Large portal illustrations and interactions were reduced so dashboard content remains the primary visual hierarchy. The CSRD score/world and Business Brain illustration now use bounded dimensions, mobile removes the decorative CSRD world, and compact responsive CSS is guaranteed to load after the base CSRD stylesheet.

A Playwright visual-density harness now captures nine screenshots on every relevant change and fails on oversized visuals or horizontal overflow. The same harness has been run against production successfully.
