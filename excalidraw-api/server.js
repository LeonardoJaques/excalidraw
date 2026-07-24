const http = require("http");
const { Pool } = require("pg");

const ROUTE_LIBRARY = "/excalidraw/api/library";
const ROUTE_SCENES = "/excalidraw/api/scenes";
const REMOTE_USER_HEADER = (process.env.REMOTE_USER_HEADER || "remote-user").toLowerCase();
const DEFAULT_USER_ID = "default";
const MAX_BODY_BYTES = 50 * 1024 * 1024;

const pool = new Pool();

const getUserId = (req) => {
  const header = req.headers[REMOTE_USER_HEADER];
  if (!header) {
    console.warn(
      `missing "${REMOTE_USER_HEADER}" header, falling back to single-tenant user "${DEFAULT_USER_ID}"`,
    );
    return DEFAULT_USER_ID;
  }
  return Array.isArray(header) ? header[0] : header;
};

const sendJSON = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        reject(new Error("payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const isValidUUID = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const handleLibraryGet = async (req, res) => {
  const userId = getUserId(req);
  const { rows } = await pool.query(
    "SELECT data FROM library_items WHERE user_id = $1",
    [userId],
  );
  sendJSON(res, 200, rows[0]?.data ?? { libraryItems: [] });
};

const handleLibraryPut = async (req, res) => {
  const userId = getUserId(req);
  let parsed;
  try {
    parsed = JSON.parse(await readBody(req));
    if (!Array.isArray(parsed.libraryItems)) {
      throw new Error("missing libraryItems array");
    }
  } catch {
    return sendJSON(res, 400, { error: "invalid body" });
  }
  await pool.query(
    `INSERT INTO library_items (user_id, data, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = now()`,
    [userId, parsed],
  );
  sendJSON(res, 200, { ok: true });
};

const handleScenesList = async (req, res) => {
  const userId = getUserId(req);
  const { rows } = await pool.query(
    "SELECT id, name, created_at, updated_at FROM scenes WHERE user_id = $1 ORDER BY updated_at DESC",
    [userId],
  );
  sendJSON(res, 200, { scenes: rows });
};

const handleSceneSave = async (req, res) => {
  const userId = getUserId(req);
  let parsed;
  try {
    parsed = JSON.parse(await readBody(req));
    if (typeof parsed.name !== "string" || !parsed.name.trim()) {
      throw new Error("missing name");
    }
    if (typeof parsed.data !== "object" || parsed.data === null) {
      throw new Error("missing data");
    }
  } catch {
    return sendJSON(res, 400, { error: "invalid body" });
  }
  const { rows } = await pool.query(
    `INSERT INTO scenes (user_id, name, data, updated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id, name) DO UPDATE SET data = $3, updated_at = now()
     RETURNING id, name, updated_at`,
    [userId, parsed.name.trim(), parsed.data],
  );
  sendJSON(res, 200, rows[0]);
};

const handleSceneGet = async (req, res, id) => {
  const userId = getUserId(req);
  const { rows } = await pool.query(
    "SELECT data FROM scenes WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  if (!rows[0]) {
    return sendJSON(res, 404, { error: "not found" });
  }
  sendJSON(res, 200, { data: rows[0].data });
};

const handleSceneDelete = async (req, res, id) => {
  const userId = getUserId(req);
  const { rowCount } = await pool.query(
    "DELETE FROM scenes WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  if (!rowCount) {
    return sendJSON(res, 404, { error: "not found" });
  }
  sendJSON(res, 200, { ok: true });
};

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, "http://localhost");

    if (pathname === ROUTE_LIBRARY) {
      if (req.method === "GET") return await handleLibraryGet(req, res);
      if (req.method === "PUT") return await handleLibraryPut(req, res);
      return sendJSON(res, 405, { error: "method not allowed" });
    }

    if (pathname === ROUTE_SCENES) {
      if (req.method === "GET") return await handleScenesList(req, res);
      if (req.method === "POST") return await handleSceneSave(req, res);
      return sendJSON(res, 405, { error: "method not allowed" });
    }

    if (pathname.startsWith(`${ROUTE_SCENES}/`)) {
      const id = pathname.slice(ROUTE_SCENES.length + 1);
      if (!isValidUUID(id)) return sendJSON(res, 400, { error: "invalid id" });
      if (req.method === "GET") return await handleSceneGet(req, res, id);
      if (req.method === "DELETE") return await handleSceneDelete(req, res, id);
      return sendJSON(res, 405, { error: "method not allowed" });
    }

    sendJSON(res, 404, { error: "not found" });
  } catch (error) {
    console.error(error);
    sendJSON(res, 500, { error: "internal error" });
  }
});

server.listen(80, () => console.log(`excalidraw-api listening on :80`));
