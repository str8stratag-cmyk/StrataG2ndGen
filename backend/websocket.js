/**
 * WebSocket Handler - Real-Time Sync
 * StrataG2ndGen - Real-time dispatch coordination
 */

export function initializeWebSocket(io, logger) {
  io.on('connection', (socket) => {
    logger.info('🔌 WebSocket client connected', { socketId: socket.id });

    socket.on('join-dispatchers', () => {
      socket.join('dispatchers');
      logger.debug(`Client ${socket.id} joined dispatchers room`);
    });

    socket.on('join-driver', (driverId) => {
      socket.join(`driver:${driverId}`);
      logger.debug(`Client ${socket.id} joined driver room: ${driverId}`);
    });

    socket.on('join-incident', (incidentId) => {
      socket.join(`incident:${incidentId}`);
      logger.debug(`Client ${socket.id} joined incident room: ${incidentId}`);
    });

    socket.on('update-driver-location', (data) => {
      const { driverId, lat, lng, address } = data;
      io.emit('driver-location-updated', {
        driverId, lat, lng, address,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('acknowledge-incident', (data) => {
      const { incidentId, driverId, status } = data;
      io.to('dispatchers').emit('dispatch-acknowledged', {
        incidentId, driverId, status,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('emergency-assistance', (data) => {
      const { driverId, incidentId, message } = data;
      io.to('dispatchers').emit('emergency-alert', {
        driverId, incidentId, message,
        priority: 'CRITICAL',
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      logger.info('🔌 WebSocket client disconnected', { socketId: socket.id });
    });

    socket.on('error', (error) => {
      logger.error('WebSocket error', { socketId: socket.id, error: error.message });
    });
  });

  io.on('error', (error) => {
    logger.error('WebSocket server error', { error: error.message });
  });

  logger.info('✅ WebSocket server initialized');
}

export function emitToDispatchers(io, event, data) {
  io.to('dispatchers').emit(event, data);
}

export function emitToIncidentRoom(io, incidentId, event, data) {
  io.to(`incident:${incidentId}`).emit(event, data);
}

export function emitToDriverRoom(io, driverId, event, data) {
  io.to(`driver:${driverId}`).emit(event, data);
}
