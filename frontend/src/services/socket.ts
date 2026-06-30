import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinDispatchersRoom() {
  const s = getSocket();
  s.emit('join-dispatchers');
}

export function joinDriverRoom(driverId: string) {
  const s = getSocket();
  s.emit('join-driver', driverId);
}

export function joinIncidentRoom(incidentId: string) {
  const s = getSocket();
  s.emit('join-incident', incidentId);
}

export function onRadioCallReceived(callback: (call: any) => void) {
  const s = getSocket();
  s.on('radio-call-received', callback);
  return () => s.off('radio-call-received', callback);
}

export function onSignal4Detected(callback: (call: any) => void) {
  const s = getSocket();
  s.on('signal4-detected', callback);
  return () => s.off('signal4-detected', callback);
}

export function onIncidentCreated(callback: (incident: any) => void) {
  const s = getSocket();
  s.on('incident-created', callback);
  return () => s.off('incident-created', callback);
}

export function onIncidentDispatched(callback: (incident: any) => void) {
  const s = getSocket();
  s.on('incident-dispatched', callback);
  return () => s.off('incident-dispatched', callback);
}

export function onDriverStatusChanged(callback: (driver: any) => void) {
  const s = getSocket();
  s.on('driver-status-changed', callback);
  return () => s.off('driver-status-changed', callback);
}

export default { getSocket, connectSocket, disconnectSocket };
