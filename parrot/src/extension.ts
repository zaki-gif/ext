import * as vscode from 'vscode';
import { io, Socket } from 'socket.io-client';
import { getAllFilesAndFolders, workspaceData } from './utils/getAllFilesAndFolders.js';
import { encode, decode } from '@msgpack/msgpack';
import { socketHandler } from './sockets/index.js';


let socket: Socket | null = null;
const SERVER_URL = `http://localhost:8000`;

export function activate(context: vscode.ExtensionContext) {
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
