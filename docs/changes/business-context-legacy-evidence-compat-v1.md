# Business context legacy evidence compatibility v1

The multi-context Business OS separates a company's primary operating phase from strategic events such as buy-side, sell-side and portfolio management.

This forward fix preserves the old lifecycle contract for existing callers: when an old lifecycle field explicitly says `buy`, `sell` or `portfolio`, the compatibility projection remains evidence-backed even though the new primary business phase can still be unknown.

No new state store or duplicate context model was introduced.
