# Meetup: Zoom-style video calls

## Run it
    npm install
    npm start
Open http://localhost:3000 in two browser tabs (or two devices on your network), enter the same meeting code, and join.

## How it works
- Browsers send video/audio directly to each other with WebRTC (mesh, one connection per pair).
- `server.js` only relays setup messages (offers, answers, ICE) and chat over WebSocket.
- Works up to ~6 people per room.

## Going live (Pune or anywhere)
1. Camera/mic access requires HTTPS on any address other than localhost. Deploy on Render, Railway or Fly.io (they give HTTPS), or put Nginx + Let's Encrypt in front of a VPS.
2. Add a TURN server for people behind strict firewalls or mobile networks (coturn, or a hosted service like Twilio or Metered). Put its URL and credentials in the `ICE` constant in `public/index.html`.
3. For 10+ participants, switch from mesh to an SFU such as LiveKit, mediasoup or Janus.
4. Add login, meeting passwords and rate limiting before sharing publicly.
