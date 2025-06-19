import * as vscode from 'vscode';
import { io } from 'socket.io-client';
import { getAllFilesAndFolders, workspaceData } from './getAllFilesAndFolders.js';
import { encode, decode } from '@msgpack/msgpack';
let socket = null;
const SERVER_URL = `http://localhost:8000`;
export function activate(context) {
    const startExtension = vscode.commands.registerCommand('extension.startExtension', async () => {
        const options = ['Create a room', 'Join a room'];
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Choose what you would like to do',
        });
        if (!selected) {
            vscode.window.showErrorMessage('No option selected');
            return;
        }
        socket = io(SERVER_URL);
        socket.on('connect', async () => {
            console.log(`connected to server ${socket?.id}`);
            if (selected === 'Create a room') {
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
            }
            if (selected === 'Join a room') {
                const roomCode = await vscode.window.showInputBox({
                    placeHolder: 'Enter Room Code'
                });
                if (!roomCode) {
                    vscode.window.showErrorMessage('invalid room code');
                    return;
                }
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
            }
        });
        socket.on('disconnect', () => {
            console.log('disconnected from server');
        });
    });
    context.subscriptions.push(startExtension);
}
export function deactivate() {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('disconnected to sever');
    }
}
//# sourceMappingURL=extension.js.map