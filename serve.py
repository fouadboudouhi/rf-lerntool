#!/usr/bin/env python3
"""Startet das Robot Framework Lerntool lokal.

    python serve.py            -> http://localhost:8000
    python serve.py 8080       -> anderer Port

Es wird nur Python (3.8+) benötigt, keine weiteren Pakete und kein Internet.
"""
import http.server
import mimetypes
import os
import sys
import webbrowser
from functools import partial

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))

# WebAssembly und ES-Module korrekt ausliefern (auf manchen Systemen nicht registriert)
mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/javascript", ".mjs")
mimetypes.add_type("application/json", ".json")


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Kein Caching, damit Änderungen an Lektionen sofort sichtbar sind
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "404" in str(args):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    handler = partial(Handler, directory=ROOT)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        url = f"http://localhost:{PORT}/"
        print(f"Robot Framework Lerntool läuft unter {url}  (Beenden mit Strg+C)")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nBeendet.")
