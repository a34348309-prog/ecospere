import http from 'http';
import app from './app';
import { initializeSocketIO } from './lib/socket';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with user room support
const io = initializeSocketIO(server);

// Start server
server.listen(PORT, () => {
    console.log(`\n🌿 EcoSphere API Server`);
    console.log(`   ├── Port:    ${PORT}`);
    console.log(`   ├── API:     http://localhost:${PORT}/api/v1`);
    console.log(`   ├── Docs:    http://localhost:${PORT}/api/docs`);
    console.log(`   ├── Socket:  ws://localhost:${PORT}`);
    console.log(`   └── Health:  http://localhost:${PORT}/\n`);
});

export { server, io };
