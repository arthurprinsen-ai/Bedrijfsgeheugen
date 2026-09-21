# Immediate English translation for the mobile menu

Fingerprint: `global-i18n-immediate-menu-translation-v1`

The mobile menu already had deterministic English translations for canonical items such as Pricing, Knowledge, About us, Free self-scan, Log in and Sign up. The defect was execution order: the runtime waited for the remote page-translation service before writing even those local translations.

The runtime now applies the canonical menu and authentication translations synchronously as soon as English is selected. The remote translation service then continues for the rest of the page content.

Dynamic menu rebuilds also receive the local English core copy immediately, so a menu rerender cannot revert visible navigation back to Dutch while English remains selected.
