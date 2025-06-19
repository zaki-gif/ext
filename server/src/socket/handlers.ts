import { Server, Socket } from 'socket.io';
import { createUniqueRoomCode, activeRooms, activeUsers, UserData } from '../utils/roomManager';

export function handleSocketConnection(socket: Socket, io: Server) {
    socket.on('Create a room', () => {
        let givenRoomWorkSpaceData: number[][] = [];
        const roomCode = createUniqueRoomCode(socket.id);

        socket.join(roomCode);
        socket.emit('room created', roomCode);

        socket.on('sending workspace data', ({ index, chunk }: { index: number, chunk: Array<number> }) => {
            givenRoomWorkSpaceData[index] = chunk;
        });

        socket.on('workspace data sent', () => {
            console.log('Data recieved');
            const room = activeRooms.get(roomCode);

            if (!room) {
                console.log('room not found');
                return;
            }

            room.workspaceData = givenRoomWorkSpaceData;

            console.log('workspace data saved');
        });
    });

    socket.on('disconnect', () => {
        console.log(`socket disconnected ${socket.id}`);
        const socketId = socket.id;
        const socketRoom = activeUsers.get(socketId)?.roomCode;
        const isHost = activeUsers.get(socketId)?.host;

        if (isHost && socketRoom) {
            const otherSocketsArray = activeRooms.get(socketRoom)?.users;

            if (otherSocketsArray) {
                otherSocketsArray.forEach(otherSocketId => {
                    io.sockets.sockets.get(otherSocketId)?.leave(socketRoom);
                    activeUsers.delete(otherSocketId);
                });
            }

            activeRooms.delete(socketRoom);
        }

        if (socketRoom) {
            const room = activeRooms.get(socketRoom);

            if (room) {
                room.users = room.users.filter(id => id !== socketId);
            }
            activeUsers.delete(socketId);
        }
    });
}
