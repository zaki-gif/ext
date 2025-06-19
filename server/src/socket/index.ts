import {Server, Socket} from 'socket.io'
import {handleSocketConnection} from './handlers';
export function setupSocket(io: Server) {
    io.on('connection', (socket: Socket)=>{
        console.log(`A new user connected ${socket.id}`);
        handleSocketConnection(socket, io);
    });
}