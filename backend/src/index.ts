import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import app from './app';
import { connectDB } from './config/db';
import { setupSignalingServer } from './signaling/server';
import { startJobs } from './jobs';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const httpServer = createServer(app);

  // WebRTC signaling via WebSocket
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  setupSignalingServer(wss);

  // Background jobs (installments cron, etc.) — must start AFTER db is up.
  startJobs();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    console.log(`WebSocket signaling server active at ws://localhost:${PORT}/ws`);
  });
});
