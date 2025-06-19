import { Server, Socket } from 'socket.io';
import { createUniqueRoomCode, activeRooms, activeUsers } from '../utils/roomManager';
import { encode, decode } from '@msgpack/msgpack';

export function handleSocketConnection(socket: Socket, io: Server) {
    socket.on('Create a room', () => {
        let givenRoomWorkSpaceData: number[][] | null = [];
        const roomCode = createUniqueRoomCode(socket.id);

        socket.join(roomCode);
        socket.emit('room created', roomCode);

        socket.on('sending workspace data', ({ index, chunk }: { index: number, chunk: Array<number> }) => {
            if (givenRoomWorkSpaceData)
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
            givenRoomWorkSpaceData = null;
        });
    });

    socket.on('Join a room', (roomCode) => {
        if (!activeRooms.has(roomCode)) {
            console.log('This room isnt active');
        }
        activeUsers.set(socket.id, {
            roomCode,
            host: false
        });

        const roomData = activeRooms.get(roomCode);
        roomData?.users.push(socket.id);
        socket.join(roomCode);

        socket.emit('joined room');

        const encodedRoomData = encode(roomData);
        const chunkSize = 250_000;
        for (let i = 0, index = 0; i < encodedRoomData.length; i += chunkSize, index++) {
            const chunk = encodedRoomData.slice(i, i + chunkSize);
            socket?.emit('sending workspace data', { index, chunk: Array.from(chunk) });
            console.log(`data sent`, Array.from(chunk));
        }

        socket?.emit('workspace data sent');


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
