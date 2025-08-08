import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './socket';
import dotenv from 'dotenv';


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
dotenv.config();
const port:number = Number(process.env.PORT);

setupSocket(io);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
