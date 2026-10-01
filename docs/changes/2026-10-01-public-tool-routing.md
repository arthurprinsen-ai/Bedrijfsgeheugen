# Public tool routes

The customer-facing routes for the package advisor and interactive portal demo are now explicitly owned by Netlify routing.

- `/pakketadvies` rewrites to `/pakketadvies.html`.
- `/portaal-demo` rewrites to `/portaal-demo.html`.
- Canonical URLs stay unchanged.
- The existing interactive page runtimes are preserved.

This removes reliance on implicit pretty-URL behavior for two conversion-critical journeys.
