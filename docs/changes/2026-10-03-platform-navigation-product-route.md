# Platform navigation route corrected

The public site exposed inconsistent destinations for the label **Platform**. The desktop navigation already opened `/product`, while the mobile/overlay navigation could open `/bedrijfsgeheugen`.

The shared navigation runtime now enforces `/product` as the canonical destination for every navigation anchor labelled **Platform**. The guard remains active after page load so a later CMS/navigation overlay cannot silently restore the outdated route.

This is a navigation correction only; the product page content is unchanged.
