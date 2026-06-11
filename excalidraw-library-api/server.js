const http = require("http");
const fs = require("fs");
const path = require("path");

const DATA_FILE = process.env.LIBRARY_FILE || "/data/library.json";
const ROUTE = "/excalidraw/api/library";

const server = http.createServer((req, res) => {
  if (req.url !== ROUTE) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
    return;
  }

  if (req.method === "GET") {
    fs.readFile(DATA_FILE, "utf-8", (err, data) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(err ? JSON.stringify({ libraryItems: [] }) : data);
    });
    return;
  }

  if (req.method === "PUT") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        if (!Array.isArray(parsed.libraryItems)) {
          throw new Error("missing libraryItems array");
        }
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid body" }));
      }
    });
    return;
  }

  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "method not allowed" }));
});

server.listen(80, () => console.log(`excalidraw-library-api listening on :80, route ${ROUTE}`));
