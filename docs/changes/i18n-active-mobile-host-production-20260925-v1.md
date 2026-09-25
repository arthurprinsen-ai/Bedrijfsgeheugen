# NL/EN active mobile host recovery

The central language runtime previously assumed that one discovered mobile navigation root represented the active drawer. On pages with multiple mobile navigation surfaces, the language select could therefore exist only inside a hidden host.

The runtime now mounts one idempotent mobile language control in every distinct mobile navigation host. The production verifier opens the active drawer, selects only a visible language control and proves NL→EN→NL behavior on the homepage, pricing page and systems-koppelingen page.

This is terminal only after protected merge, exact-main Netlify deployment and the three-route browser proof are green.
