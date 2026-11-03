"""Master of Your Universe: local game server (Python 3.9+, no installs).

Serves the game, forwards image requests (so the browser can reach Unsloth on this laptop without CORS trouble),
saves generated dioramas into ./images and player sessions into ./sessions.

Run:  python3 server.py            then open http://localhost:8777
"""
import base64, csv, io, json, os, re, sys, time, urllib.request, urllib.error
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IMAGES = ROOT / "images"; IMAGES.mkdir(exist_ok=True)
SESSIONS = ROOT / "sessions"; SESSIONS.mkdir(exist_ok=True)
PORT = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else int(os.environ.get("PORT", "8777"))
KEY_FILES = [Path.home() / "Desktop" / "master-of-your-universe.env", ROOT / "keys.env"]
NAMES = ["GEMINI_API_KEY", "OPENAI_API_KEY", "FAL_KEY", "UNSLOTH_API_KEY", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "POLLINATIONS_API_KEY"]
BASE_ENV = {k: os.environ.get(k, "") for k in NAMES}
KEYS, KEYS_FOUND, ENV_KEYS, _stamp = {}, {}, {}, None

def load_keys(verbose=False):
    """Read KEY=value lines from master-of-your-universe.env on the Desktop (or keys.env here).
    Re-read whenever the file changes, so saving new keys needs no restart. Keys never reach the browser."""
    global KEYS, KEYS_FOUND, ENV_KEYS, _stamp
    stamp = tuple((str(f), f.stat().st_mtime) for f in KEY_FILES if f.exists())
    if stamp == _stamp: return
    _stamp = stamp; k = dict(BASE_ENV)
    # the most recently saved key file wins
    for f in sorted((f for f in KEY_FILES if f.exists()), key=lambda f: f.stat().st_mtime, reverse=True):
        try: os.chmod(f, 0o600)
        except Exception: pass
        for line in f.read_text(errors="ignore").splitlines():
            line = line.strip()
            if line.startswith("export "): line = line[7:].strip()
            if line and not line.startswith("#") and "=" in line:
                name, v = line.split("=", 1); name = name.strip(); v = v.strip().strip('"').strip("'").strip()
                if name in k and v and not v.startswith("paste-") and not k[name]: k[name] = v
        if verbose: print(f"  Reading keys from {f}")
    # a Google AI Studio key (AIza... or AQ....) pasted on the wrong line is used as the Gemini key
    for n in ("OPENAI_API_KEY", "FAL_KEY", "UNSLOTH_API_KEY", "CLOUDFLARE_API_TOKEN"):
        if k[n].startswith(("AIza", "AQ.")):
            if not k["GEMINI_API_KEY"]: k["GEMINI_API_KEY"] = k[n]
            k[n] = ""
            if verbose: print(f"  Note: {n} holds a Google AI Studio key, so it is used as GEMINI_API_KEY.")
    KEYS = k
    bearer = lambda n: "Bearer " + k[n] if k[n] else ""
    ENV_KEYS = {"generativelanguage.googleapis.com": ("x-goog-api-key", k["GEMINI_API_KEY"]),
                "api.openai.com": ("Authorization", bearer("OPENAI_API_KEY")),
                "fal.run": ("Authorization", "Key " + k["FAL_KEY"] if k["FAL_KEY"] else ""),
                "api.cloudflare.com": ("Authorization", bearer("CLOUDFLARE_API_TOKEN")),
                "127.0.0.1:8888": ("Authorization", bearer("UNSLOTH_API_KEY")),
                "image.pollinations.ai": ("Authorization", bearer("POLLINATIONS_API_KEY"))}
    KEYS_FOUND = {"gemini": bool(k["GEMINI_API_KEY"]), "openai": bool(k["OPENAI_API_KEY"]), "fal": bool(k["FAL_KEY"]), "unsloth": bool(k["UNSLOTH_API_KEY"]),
                  "cloudflare": bool(k["CLOUDFLARE_API_TOKEN"]), "cloudflareAccount": bool(k["CLOUDFLARE_ACCOUNT_ID"]), "pollinations": bool(k["POLLINATIONS_API_KEY"])}
load_keys(verbose=True)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
    def log_message(self, fmt, *args): pass
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()

    def send_json(self, obj, code=200):
        b = json.dumps(obj).encode(); self.send_response(code)
        self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

    def body(self): return self.rfile.read(int(self.headers.get("Content-Length", 0)) or 0)

    def do_GET(self):
        load_keys()
        if self.path == "/api/health": return self.send_json({"ok": True, "server": "local", "keys": KEYS_FOUND})
        if self.path == "/api/export.csv": return self.export()
        if self.path == "/api/sessions": return self.send_json([json.loads(p.read_text()) for p in sorted(SESSIONS.glob("*.json"))])
        return super().do_GET()

    def do_POST(self):
        try:
            if self.path == "/api/proxy": return self.proxy()
            if self.path == "/api/save-image": return self.save_image()
            if self.path == "/api/session":
                (SESSIONS / time.strftime("%Y%m%d-%H%M%S.json")).write_bytes(self.body()); return self.send_json({"ok": True})
            self.send_json({"error": "not found"}, 404)
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

    def proxy(self):
        load_keys(); req = json.loads(self.body() or b"{}")
        url, method = req.get("url", ""), req.get("method", "GET")
        if "{account}" in url: url = url.replace("{account}", KEYS["CLOUDFLARE_ACCOUNT_ID"])
        if not re.match(r"^https?://", url): return self.send_json({"error": "bad url"}, 400)
        headers = {k: v for k, v in (req.get("headers") or {}).items() if v}
        host = re.sub(r"^https?://([^/]+).*$", r"\1", url)
        if host not in ENV_KEYS: host = re.sub(r":\d+$", "", host)
        if host in ENV_KEYS and ENV_KEYS[host][1] and not any(h.lower() in ("authorization", "x-goog-api-key") for h in headers):
            headers[ENV_KEYS[host][0]] = ENV_KEYS[host][1]
        data = base64.b64decode(req["body64"]) if req.get("body64") else None
        r = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(r, timeout=600) as resp:
                status, ctype, out = resp.status, resp.headers.get("Content-Type", "application/json"), resp.read()
        except urllib.error.HTTPError as e:
            status, ctype, out = e.code, e.headers.get("Content-Type", "application/json"), e.read()
        except urllib.error.URLError as e:
            return self.send_json({"error": f"Could not reach {host}: {e.reason}. Is the service running?"}, 502)
        self.send_response(status); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(out))); self.end_headers(); self.wfile.write(out)

    def save_image(self):
        req = json.loads(self.body())
        name = re.sub(r"[^A-Za-z0-9_-]", "", req.get("id", ""))
        m = re.match(r"^data:image/[a-z]+;base64,(.+)$", req.get("dataUrl", ""))
        if not name or not m: return self.send_json({"error": "bad image"}, 400)
        (IMAGES / f"{name}.png").write_bytes(base64.b64decode(m.group(1)))
        self.send_json({"ok": True})

    def export(self):
        buf = io.StringIO(); w = csv.writer(buf); w.writerow(["time", "name", "role", "step", "picks", "free_text", "seconds", "favourite", "change_one_thing"])
        for p in sorted(SESSIONS.glob("*.json")):
            r = json.loads(p.read_text())
            for k, v in r.get("picks", {}).items():
                w.writerow([r.get("at"), r.get("name"), r.get("role"), k, " | ".join(v), r.get("free", {}).get(k, ""), r.get("times", {}).get(k, ""), r.get("favourite"), r.get("change", "")])
        b = buf.getvalue().encode(); self.send_response(200)
        self.send_header("Content-Type", "text/csv"); self.send_header("Content-Disposition", "attachment; filename=sessions.csv"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)


if __name__ == "__main__":
    found = [k for k, v in KEYS_FOUND.items() if v]
    print(f"\n  Master of Your Universe is running on http://localhost:{PORT}")
    print(f"  Photo keys loaded: {', '.join(found) if found else 'none yet (add them to master-of-your-universe.env on your Desktop, then reload the page)'}")
    print("  Keep this window open while you play. Close it to stop.\n")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
