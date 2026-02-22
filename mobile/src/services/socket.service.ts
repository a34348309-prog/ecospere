import { io, Socket } from "socket.io-client";
import { LOCAL_IP, PORT } from "./api.config";

let socket: Socket | null = null;

type AQIAlertData = {
  aqi: number;
  status: string;
  message: string;
  timestamp: string;
};

type AQIUpdateData = {
  aqi: number;
  status: string;
  alert: boolean;
  components: any;
  tileId: string;
  usersInTile: number;
  timestamp: string;
};

type AlertCallback = (data: AQIAlertData) => void;
type UpdateCallback = (data: AQIUpdateData) => void;

const alertListeners: AlertCallback[] = [];
const updateListeners: UpdateCallback[] = [];

/**
 * Connect to the Socket.io server and join the user's personal room.
 */
export const connectSocket = (userId: string) => {
  if (socket?.connected) return;

  socket = io(`http://${LOCAL_IP}:${PORT}`, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket?.id);
    // Join personal room (tile room is managed by backend on location update)
    socket?.emit("join-room", userId);
  });

  // Personal unhealthy AQI alerts
  socket.on("aqi-alert", (data: AQIAlertData) => {
    console.log("[Socket] AQI Alert received:", data);
    alertListeners.forEach((cb) => cb(data));
  });

  // Tile-based AQI broadcasts (from any user in your area)
  socket.on("aqi-update", (data: AQIUpdateData) => {
    console.log(
      `[Socket] AQI Update for ${data.tileId}: AQI ${data.aqi} (${data.usersInTile} users)`,
    );
    updateListeners.forEach((cb) => cb(data));
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected");
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket] Connection error:", err.message);
  });
};

/**
 * Disconnect from the Socket.io server.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Subscribe to personal AQI alerts (unhealthy air). Returns unsubscribe.
 */
export const onAQIAlert = (callback: AlertCallback): (() => void) => {
  alertListeners.push(callback);
  return () => {
    const idx = alertListeners.indexOf(callback);
    if (idx !== -1) alertListeners.splice(idx, 1);
  };
};

/**
 * Subscribe to tile-based AQI updates (proactive area updates). Returns unsubscribe.
 */
export const onAQIUpdate = (callback: UpdateCallback): (() => void) => {
  updateListeners.push(callback);
  return () => {
    const idx = updateListeners.indexOf(callback);
    if (idx !== -1) updateListeners.splice(idx, 1);
  };
};
