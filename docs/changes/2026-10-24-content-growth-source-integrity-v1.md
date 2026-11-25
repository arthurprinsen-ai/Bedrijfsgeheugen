# Daily marketing learning: separate commercial attribution from external signals

The existing daily learning input combines an RVO regulatory/program signal and potentially GA4, Search Console, blog and social events. Radar signals have an independent purpose: they identify opportunities and deadlines, but **are not** evidence of impressions, traffic, leads or revenue. Feeding them to a performance aggregator caused an invalid-content-ID failure.

The corrected existing action now categorizes source-backed research separately and flags an expired opportunity deadline. Real attributable performance events remain eligible for the existing content optimization policy. Unknown events, duplicate IDs, undated/unsafe sources and unattributed performance observations fail closed. A source-quality description explicitly states that the repository snapshot is not a live GA4/GSC/social connector readback.

No new scheduler, learning store, publisher or security bypass was introduced. Actual provider ingestion, protected deployment and observed outcomes remain independent duties in the canonical Powerhouse system.
