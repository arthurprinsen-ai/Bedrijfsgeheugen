# Platform route enforced in final navigation contract

Production readback showed that the first runtime repair was not sufficient as source-of-truth protection: the generated V18 mobile drawer could still contain **Platform → /bedrijfsgeheugen** in its final HTML, while desktop already pointed to **/product**.

The final navigation boundary now normalizes every visible **Platform** anchor to `https://www.bedrijfsgeheugen.nl/product`. Its verifier fails closed if any generated shell publishes another Platform destination.

The regression test explicitly contains the historical mobile error and requires both desktop and mobile Platform links to resolve to the product page.
