import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";

let io: SocketIOServer;

// ── User-to-Tile Tracking ──
// Maps a userId to the tileId they are currently in
const userTileMap = new Map<string, string>();
// Maps a userId to their socketId (for room management)
const userSocketMap = new Map<string, string>();

// ── AQI Tile Cache ──
// Caches AQI data per tile to avoid redundant API calls
// TTL: 5 minutes (300,000 ms)
const TILE_CACHE_TTL = 5 * 60 * 1000;
interface TileCacheEntry {
  data: any;
  timestamp: number;
}
const tileAqiCache = new Map<string, TileCacheEntry>();

/**
 * Compute a tileId from lat/lng by rounding to 1 decimal place.
 * Each tile covers roughly ~11km x 11km at the equator.
 */
export const computeTileId = (lat: number, lng: number): string => {
  return `tile:${lat.toFixed(1)},${lng.toFixed(1)}`;
};

/**
 * Get cached AQI data for a tile. Returns null if expired or missing.
 */
export const getCachedTileAQI = (tileId: string): any | null => {
  const entry = tileAqiCache.get(tileId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TILE_CACHE_TTL) {
    tileAqiCache.delete(tileId);
    return null;
  }
  return entry.data;
};

/**
 * Cache AQI data for a tile.
 */
export const cacheTileAQI = (tileId: string, data: any): void => {
  tileAqiCache.set(tileId, { data, timestamp: Date.now() });
};

/**
 * Initialize Socket.io server with tile-based room management.
 */
export const initializeSocketIO = (server: http.Server): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket.io] User connected: ${socket.id}`);

    // Users still join a personal room for targeted alerts
    socket.on("join-room", (userId: string) => {
      socket.join(`user:${userId}`);
      userSocketMap.set(userId, socket.id);
      console.log(`[Socket.io] User ${userId} joined personal room`);
    });

    socket.on("disconnect", () => {
      // Cleanup user tracking on disconnect
      for (const [userId, sid] of userSocketMap.entries()) {
        if (sid === socket.id) {
          userTileMap.delete(userId);
          userSocketMap.delete(userId);
          console.log(
            `[Socket.io] User ${userId} disconnected, cleaned up tile tracking`,
          );
          break;
        }
      }
      console.log(`[Socket.io] Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Move a user from their current tile room to a new one.
 * Returns { tileId, isNewTile } — isNewTile is true if they actually moved.
 */
export const switchUserTile = async (
  userId: string,
  lat: number,
  lng: number,
): Promise<{ tileId: string; isNewTile: boolean }> => {
  const newTileId = computeTileId(lat, lng);
  const currentTileId = userTileMap.get(userId);

  // Same tile — no room switch needed
  if (currentTileId === newTileId) {
    return { tileId: newTileId, isNewTile: false };
  }

  const socketId = userSocketMap.get(userId);
  if (!socketId) {
    // User might not have a socket connection yet — just track
    userTileMap.set(userId, newTileId);
    return { tileId: newTileId, isNewTile: true };
  }

  const userSocket = getIO().sockets.sockets.get(socketId);
  if (userSocket) {
    // Leave old tile room
    if (currentTileId) {
      userSocket.leave(currentTileId);
      console.log(`[Socket.io] User ${userId} left tile ${currentTileId}`);
    }
    // Join new tile room
    userSocket.join(newTileId);
    console.log(`[Socket.io] User ${userId} joined tile ${newTileId}`);
  }

  userTileMap.set(userId, newTileId);
  return { tileId: newTileId, isNewTile: true };
};

/**
 * Get the Socket.io server instance.
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error(
      "Socket.io not initialized. Call initializeSocketIO() first.",
    );
  }
  return io;
};

/**
 * Emit an event to all users in a specific tile room.
 */
export const emitToTile = (tileId: string, event: string, data: any) => {
  getIO().to(tileId).emit(event, data);
};

/**
 * Emit an event to a specific user's personal room.
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

/**
 * Get the number of users currently in a tile room.
 */
export const getTileUserCount = (tileId: string): number => {
  let count = 0;
  for (const tile of userTileMap.values()) {
    if (tile === tileId) count++;
  }
  return count;
};
