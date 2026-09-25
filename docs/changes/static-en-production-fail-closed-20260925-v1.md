# Production English routes must fail closed

The central NL/EN runtime was routing correctly, but a production build could still publish a Dutch copy under /en/* whenever the translation cache was incomplete and network translation was disabled.

Production now enables the static English translation provider. The localized-route builder already treats provider failure as terminal when network translation is enabled, so a failed translation can no longer become a silently Dutch English page.

Terminal verification remains:
1. protected merge;
2. exact-main Netlify production build;
3. pricing content proof;
4. browser NL→EN→NL on homepage, pricing and systems/koppelingen;
5. no "Switching language failed. Try again." state.
