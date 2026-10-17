import { io } from 'socket.io-client';
import { API_URL } from '../config/env';

export const socket = io(API_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000
});
