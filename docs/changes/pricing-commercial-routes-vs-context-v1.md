# Pricing route semantics parity v1

The pricing page now distinguishes **commercial pricing routes** from the full Powerhouse business-context model.

Root cause: the top pricing selector still used the label “Kies je bedrijfssituatie” for six commercial examples, while Portal V2/Powerhouse supports nine business phases, ten strategic events and seven entrepreneur goals concurrently.

Fix:
- relabel the six panels as “Veelvoorkomende commerciële routes”;
- explicitly state they are examples, not the full context taxonomy;
- point users to the full route calculator for phase + event + goal;
- rename the comparison column from “Situatie” to “Commerciële route”;
- add a regression test so the old conflation cannot silently return.

This keeps pricing, portal context and Powerhouse semantics aligned without duplicating the full context engine into commercial cards.
