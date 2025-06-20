import { getAllFilesAndFolders, workspaceData } from '../utils/getAllFilesAndFolders.js';
import { encode, decode } from '@msgpack/msgpack';
export const createARoom = (socket, selected) => {
    socket?.emit(selected);
    socket?.on('room created', async (roomCode) => {
        console.log(roomCode);
        await getAllFilesAndFolders();
        console.log(workspaceData);
        const encodedData = encode(workspaceData);
        const chunkSize = 250_000;
        console.log(encodedData.length);
        for (let i = 0, index = 0; i < encodedData.length; i += chunkSize, index++) {
            const chunk = encodedData.slice(i, i + chunkSize);
            socket?.emit('sending workspace data', { index, chunk: Array.from(chunk) });
            console.log(`data sent`, Array.from(chunk));
        }
        socket?.emit('workspace data sent');
    });
};
export const joinARoom = (socket, selected, roomCode) => {
    socket?.emit(selected, roomCode);
    let givenRoomDataEncodednotFlattened = [];
    socket?.on('joined room', () => {
        console.log('joined room');
        socket?.on('sending workspace data', ({ index, chunk }) => {
            if (givenRoomDataEncodednotFlattened) {
                givenRoomDataEncodednotFlattened[index] = chunk;
            }
        });
    });
    socket?.on('workspace data sent', () => {
        //I. decode room data
        // 1. Its an array of array so join them
        // 2. its an array convert it to uint8array
        // 3. decode it to get room Data
        const givenRoomDataEncodedFlattened = givenRoomDataEncodednotFlattened?.flat();
        const givenRoomDataEncoded = new Uint8Array(givenRoomDataEncodedFlattened);
        const givenRoomDataDecoded = decode(givenRoomDataEncoded);
        console.log(givenRoomDataDecoded);
        if (!givenRoomDataDecoded) {
            console.log('no room data given');
            return;
        }
        //II. in that we will find obj property workspaceData which is again encoded
        const givenRoomWorkspaceDataNotFlattenedEncoded = givenRoomDataDecoded.workspaceData;
        const givenRoomWorkspaceDataFlattenedEncoded = givenRoomWorkspaceDataNotFlattenedEncoded?.flat();
        if (!givenRoomWorkspaceDataFlattenedEncoded) {
            return;
        }
        const givenRoomWorkspaceDataEncoded = new Uint8Array(givenRoomWorkspaceDataFlattenedEncoded);
        //III. decode that workspaceData to get original workspace data
        const givenRoomWorkspaceData = decode(givenRoomWorkspaceDataEncoded);
        console.log(givenRoomWorkspaceData);
    });
};
//# sourceMappingURL=handler.js.map