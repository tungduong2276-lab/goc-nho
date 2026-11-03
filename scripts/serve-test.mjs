import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json"
};

createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const file = resolve(root, relative);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if (!statSync(file).isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }
    let body = readFileSync(file);
    if (relative === "index.html") {
      const html = body.toString("utf8");
      const startup = "cloudInit();initDb();";
      if (!html.includes(startup)) throw new Error("Expected Firebase startup hook was not found");
      // Chỉ trong server kiểm thử: không khởi tạo Firebase hoặc ghi vào project thật.
      body = Buffer.from(html.replace(startup, "/* Firebase disabled in isolated browser tests */"));
    }
    res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch (error) {
    res.writeHead(error.code === "ENOENT" ? 404 : 500).end(String(error));
  }
}).listen(4173, "127.0.0.1", () => {
  process.stdout.write("Garden browser test server listening on http://127.0.0.1:4173\n");
});
