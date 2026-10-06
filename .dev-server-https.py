#!/usr/bin/env python3
import ssl
import http.server
import socketserver
from pathlib import Path
import os
import sys

os.chdir('/Users/danielreis/mindcubby')

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

cert_dir = Path.home() / '.mindcubby_certs'
certfile = cert_dir / 'cert.pem'
keyfile = cert_dir / 'key.pem'

ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
ssl_context.load_cert_chain(str(certfile), str(keyfile))

PORT = 8444
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    httpd.socket = ssl_context.wrap_socket(httpd.socket, server_side=True)
    print(f"✓ HTTPS Server running at https://localhost:{PORT}")
    print("  Note: Self-signed cert - browser will show security warning (safe to proceed)")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")
