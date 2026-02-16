import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';

let io: SocketIOServer;

/**
 * Initialize Socket.io server with CORS and user room management.
 */
export const initializeSocketIO = (server: http.Server): SocketIOServer => {
    io = new SocketIOServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        pingInterval: 25000,
        pingTimeout: 60000,
    });

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket.io] User connected: ${socket.id}`);

        // Users join their own room for targeted alerts
        socket.on('join-room', (userId: string) => {
            socket.join(`user:${userId}`);
            console.log(`[Socket.io] User ${userId} joined room user:${userId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.io] User disconnected: ${socket.id}`);
        });
    });

    return io;
};

/**
 * Get the Socket.io server instance.
 */
export const getIO = (): SocketIOServer => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeSocketIO() first.');
    }
    return io;
};

/**
 * Emit an event to a specific user's room.
 */
export const emitToUser = (userId: string, event: string, data: any) => {
    getIO().to(`user:${userId}`).emit(event, data);
};

/**
 * Broadcast an event to all connected clients.
 */
export const broadcast = (event: string, data: any) => {
    getIO().emit(event, data);
};
