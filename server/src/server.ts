import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './socket';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
const port = 8000;

setupSocket(io);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
