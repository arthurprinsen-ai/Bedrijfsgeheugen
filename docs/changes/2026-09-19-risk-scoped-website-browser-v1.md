# Risk-scoped website browser verification

Website browser verification is now proportional to release risk. High-risk changes still receive the sitewide visibility crawl, header-menu readability crawl and broad browser contracts. Normal-risk changes keep targeted desktop/mobile route verification, with explicit affected routes supplied by the classifier.

Regulatory data changes are mapped to `/`, `/ai-act`, `/compliance-status`, `/benchmark` and `/monitor`, avoiding an unrelated full-site crawl while retaining coverage of the relevant public surfaces.
