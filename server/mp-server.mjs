// Tiny multiplayer relay for the Arcade 3D game modes (LAN / localhost).
// Rooms of clients; the first client in a room is the HOST (simulates bots + zone
// and is the damage authority). The server itself is a dumb relay — it assigns
// ids/slots, tracks the host, and forwards every other message to the room.
import { WebSocketServer } from "ws";

const PORT = +(process.env.MP_PORT || 8031);
// Largest message a client may send (voice clips are ~2-20 KB); the ws default is 100 MB.
const MAX_PAYLOAD = 512 * 1024;
const rooms = new Map(); // name -> { clients: Map(id -> {ws, slot, name}), hostId, nextId }

export function startMPServer(portOrOpts = PORT) {
  let wss;
  if (typeof portOrOpts === "object" && portOrOpts.server) {
    // PRODUCTION: attach to the existing HTTP server so the relay
    // shares the web app's single port — clients connect to wss://<host>/mp.
    const wsPath = portOrOpts.path || "/mp";
    wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });
    portOrOpts.server.on("upgrade", (req, socket, head) => {
      if (req.url && req.url.split("?")[0] === wsPath) {
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
      } else {
        socket.destroy(); // no other upgrade handlers exist in production
      }
    });
    console.log("[mp] multiplayer relay attached at path " + wsPath);
  } else {
    // DEV / standalone: own port (localhost + LAN play)
    wss = new WebSocketServer({ port: portOrOpts, maxPayload: MAX_PAYLOAD });
    console.log("[mp] multiplayer relay listening on ws://0.0.0.0:" + portOrOpts);
  }

  wss.on("error", (e) => {
    // EADDRINUSE almost always means another dev instance already runs the relay — fine.
    console.log("[mp] server error:", e.code || e.message);
  });

  wss.on("connection", (ws) => {
    let room = null, roomName = null, id = null;

    ws.on("message", (buf) => {
      let m; try { m = JSON.parse(buf); } catch { return; }

      if (m.t === "join") {
        roomName = ("" + (m.room || "br")).slice(0, 24);
        if (!rooms.has(roomName)) rooms.set(roomName, { clients: new Map(), hostId: null, nextId: 1 });
        room = rooms.get(roomName);
        id = room.nextId++;
        // lowest free player slot
        const used = new Set([...room.clients.values()].map((c) => c.slot));
        let slot = 0; while (used.has(slot)) slot++;
        const me = { ws, slot, name: ("" + (m.name || "P" + id)).slice(0, 12) };
        room.clients.set(id, me);
        if (room.hostId == null) room.hostId = id;
        ws.send(JSON.stringify({
          t: "welcome", id, slot, host: room.hostId === id,
          peers: [...room.clients.entries()].filter(([pid]) => pid !== id)
            .map(([pid, c]) => ({ id: pid, slot: c.slot, name: c.name })),
        }));
        bcast(room, { t: "peer-join", id, slot: me.slot, name: me.name }, id);
        console.log(`[mp] ${me.name} joined ${roomName} (slot ${slot}${room.hostId === id ? ", host" : ""}) — ${room.clients.size} in room`);
        return;
      }

      if (!room || id == null) return;
      m._from = id;
      m._slot = room.clients.get(id)?.slot;
      bcast(room, m, id); // relay everything else to the rest of the room
    });

    ws.on("close", () => {
      if (!room || id == null) return;
      const c = room.clients.get(id);
      room.clients.delete(id);
      if (c) bcast(room, { t: "peer-leave", id, slot: c.slot }, null);
      if (room.hostId === id) { // promote the next client to host
        const next = room.clients.keys().next();
        room.hostId = next.done ? null : next.value;
        if (room.hostId != null) {
          room.clients.get(room.hostId).ws.send(JSON.stringify({ t: "you-are-host" }));
          bcast(room, { t: "host", id: room.hostId }, null);
        }
      }
      if (room.clients.size === 0) rooms.delete(roomName);
      console.log(`[mp] client left ${roomName} — ${room.clients.size} remain`);
    });
  });

  function bcast(room, msg, exceptId) {
    const s = JSON.stringify(msg);
    for (const [pid, c] of room.clients)
      if (pid !== exceptId && c.ws.readyState === 1) c.ws.send(s);
  }

  return wss;
}

// run directly: `node server/mp-server.mjs`
if (import.meta.url === `file://${process.argv[1]}`) startMPServer();
