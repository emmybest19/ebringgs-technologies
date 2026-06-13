import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

interface Client {
  ws: WebSocket;
  roomId: string;
  userId: string;
  name: string;
}

const clients = new Map<WebSocket, Client>();

function getRoomClients(roomId: string): Client[] {
  return Array.from(clients.values()).filter(c => c.roomId === roomId);
}

function broadcast(roomId: string, data: object, exclude?: WebSocket) {
  const msg = JSON.stringify(data);
  getRoomClients(roomId).forEach(client => {
    if (client.ws !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  });
}

export function setupSignalingServer(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());

        switch (msg.type) {
          case 'join': {
            const client: Client = { ws, roomId: msg.roomId, userId: msg.userId, name: msg.name };
            clients.set(ws, client);

            // Tell the new joiner about existing participants
            const existing = getRoomClients(msg.roomId)
              .filter(c => c.ws !== ws)
              .map(c => ({ userId: c.userId, name: c.name }));

            ws.send(JSON.stringify({ type: 'room-participants', participants: existing }));

            // Notify existing participants
            broadcast(msg.roomId, { type: 'user-joined', userId: msg.userId, name: msg.name }, ws);
            break;
          }

          case 'offer':
          case 'answer':
          case 'ice-candidate': {
            // Forward SDP/ICE to the target peer
            const target = Array.from(clients.values()).find(c => c.userId === msg.targetId);
            if (target && target.ws.readyState === WebSocket.OPEN) {
              const client = clients.get(ws);
              target.ws.send(JSON.stringify({ ...msg, fromId: client?.userId, fromName: client?.name }));
            }
            break;
          }

          case 'chat': {
            const client = clients.get(ws);
            if (client) {
              broadcast(client.roomId, {
                type: 'chat',
                fromId: client.userId,
                fromName: client.name,
                text: msg.text,
                timestamp: new Date().toISOString(),
              });
            }
            break;
          }

          case 'mute-all': {
            // Instructor only — broadcast mute command to room
            const client = clients.get(ws);
            if (client) {
              broadcast(client.roomId, { type: 'mute-all', fromId: client.userId }, ws);
            }
            break;
          }

          case 'kick': {
            const client = clients.get(ws);
            const target = Array.from(clients.values()).find(c => c.userId === msg.targetId && c.roomId === client?.roomId);
            if (target) {
              target.ws.send(JSON.stringify({ type: 'kicked' }));
              target.ws.close();
            }
            break;
          }

          case 'attendance': {
            const client = clients.get(ws);
            if (client) {
              broadcast(client.roomId, {
                type: 'attendance-update',
                participants: getRoomClients(client.roomId).map(c => ({ userId: c.userId, name: c.name })),
              });
            }
            break;
          }
        }
      } catch {
        // malformed JSON — ignore
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        broadcast(client.roomId, { type: 'user-left', userId: client.userId, name: client.name });
        clients.delete(ws);
      }
    });
  });
}
