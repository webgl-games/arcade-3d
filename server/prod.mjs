// Production server: Next.js + the multiplayer relay on ONE port.
// Most hosts expose a single $PORT, so the ws relay attaches to the same HTTP
// server at path /mp (clients connect to wss://<host>/mp when served over https).
import { createServer } from "node:http";
import next from "next";
import { startMPServer } from "./mp-server.mjs";

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  startMPServer({ server, path: "/mp" });
  server.listen(port, () => {
    console.log(`> Arcade 3D live on :${port} (web + /mp websocket relay)`);
  });
});
