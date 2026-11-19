// socket.ts
import { io } from 'socket.io-client';

export const socket = io('https://burguer-api-production.up.railway.app', {
  autoConnect: true,
});