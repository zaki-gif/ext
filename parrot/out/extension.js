import * as vscode from 'vscode';
import { io } from 'socket.io-client';
import { socketHandler } from './sockets/index.js';
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
        socketHandler(socket, selected);
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