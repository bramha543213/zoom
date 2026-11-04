// Signaling server: relays WebRTC offers/answers/ICE and chat between people in the same room.
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map(); // roomName -> Map(id -> { ws, name })
const MAX_PER_ROOM = 6;  // mesh video gets heavy beyond ~6 people

const send = (ws, msg) => ws.readyState === 1 && ws.send(JSON.stringify(msg));

wss.on('connection', (ws) => {
  let room = null;
  const id = crypto.randomUUID();

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }

    if (m.type === 'join') {
      room = String(m.room || '').slice(0, 40);
      const name = String(m.name || 'Guest').slice(0, 30);
      if (!room) return;
      if (!rooms.has(room)) rooms.set(room, new Map());
      const members = rooms.get(room);
      if (members.size >= MAX_PER_ROOM) {
        send(ws, { type: 'full' });
        room = null;
        return;
      }
      const peers = [...members].map(([pid, p]) => ({ id: pid, name: p.name }));
      members.set(id, { ws, name });
      send(ws, { type: 'welcome', id, peers });
      members.forEach((p, pid) => pid !== id && send(p.ws, { type: 'peer-joined', id, name }));
      return;
    }

    const members = room && rooms.get(room);
    if (!members) return;

    if (m.type === 'signal') {
      const target = members.get(m.to);
      if (target) send(target.ws, { type: 'signal', from: id, data: m.data });
    } else if (m.type === 'chat') {
      const text = String(m.text || '').slice(0, 1000);
      members.forEach((p) => send(p.ws, { type: 'chat', from: id, name: members.get(id).name, text }));
    }
  });

  ws.on('close', () => {
    const members = room && rooms.get(room);
    if (!members) return;
    members.delete(id);
    members.forEach((p) => send(p.ws, { type: 'peer-left', id }));
    if (!members.size) rooms.delete(room);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Meetup running on http://localhost:${PORT}`));
