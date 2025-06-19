import * as vscode from 'vscode';
import { io } from 'socket.io-client';
import { getAllFilesAndFolders, workspaceData } from './getAllFilesAndFolders.js';
import { encode } from '@msgpack/msgpack';
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
                    for (let i = 0, index = 0; i < encodedData.length; i += chunkSize, index++) {
                        const chunk = encodedData.slice(i, i + chunkSize);
                        socket?.emit('sending workspace data', { index, chunk: Array.from(chunk) });
                        console.log(`data sent`, Array.from(chunk));
                    }
                    socket?.emit('workspace data sent');
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