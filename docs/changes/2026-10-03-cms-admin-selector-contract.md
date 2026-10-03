# CMS admin selector contract recovery

The CMS runtime used the same helper identity for single-element and collection queries. That caused event binding failures on `/cms` and left collection bindings ambiguous.

This recovery restores separate selector responsibilities and adds an executable contract proving the helpers remain distinct and the `data-area` collection binding uses the collection helper. Runtime acceptance remains the real `/cms` page-check with no JavaScript exceptions.
