import * as vscode from 'vscode';
import { createARoom, joinARoom } from './handler.js';
export const socketHandler = (socket, selected) => {
    socket.on('connect', async () => {
        console.log(`connected to server ${socket?.id}`);
        if (selected === 'Create a room') {
            createARoom(socket, selected);
        }
        if (selected === 'Join a room') {
            const roomCode = await vscode.window.showInputBox({
                placeHolder: 'Enter Room Code'
            });
            if (!roomCode) {
                vscode.window.showErrorMessage('invalid room code');
                return;
            }
            joinARoom(socket, selected, roomCode);
        }
    });
    socket.on('disconnect', () => {
        console.log('disconnected from server');
    });
};
//# sourceMappingURL=index.js.map