# Fix clean URLs for package advisor and portal demo

Two public conversion journeys use clean URLs: /pakketadvies and /portaal-demo. Their HTML pages existed, but the Netlify routing table did not explicitly map those clean URLs to the generated files.

The routing table now contains explicit 200 rewrites for both destinations. This keeps the visible URL clean while serving the intended page and prevents buttons from landing on an error page.
