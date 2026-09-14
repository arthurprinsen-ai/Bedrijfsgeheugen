#!/usr/bin/env python3
import argparse
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class CleanUrlHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        translated = super().translate_path(path)
        if os.path.exists(translated):
            return translated
        if not path.endswith('/'):
            candidate = translated + ".html"
            if os.path.isfile(candidate):
                return candidate
        return translated


def main():
    parser = argparse.ArgumentParser(description="Serve static site with Netlify-style clean HTML URLs")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.bind, args.port), CleanUrlHandler)
    print(f"Serving clean URLs on http://{args.bind}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
