import * as vscode from 'vscode';
import ignore from 'ignore';

let workspaceData: any;

function splitBufferToStringChunks(buffer: Uint8Array, maxChunkSizeMB = 200): string[] {
    const maxBytes = maxChunkSizeMB * 1024 * 1024; // Convert MB to bytes
    const chunks: string[] = [];

    let offset = 0;

    while (offset < buffer.length) {
        // Slice a chunk of buffer
        const end = Math.min(offset + maxBytes, buffer.length);
        const chunk = buffer.slice(offset, end);
        // Convert chunk to string (assumes UTF-8)
        chunks.push(Buffer.from(chunk).toString('utf-8'));
        offset = end;
    }

    return chunks;
}


export const getAllFilesAndFolders = async () => {
	const ig = ignore();

	const workspaces = vscode.workspace.workspaceFolders;

	if (!workspaces) {
		vscode.window.showErrorMessage('No Workspace found');
		return;
	}

	const options = workspaces.map(ws => ws.name);

	const selected = await vscode.window.showQuickPick(options, {
		placeHolder: 'Choose a workspace',
	});

	if (!selected) {
		vscode.window.showErrorMessage('No workspace selected');
		return;
	}

	const selectedWorkspace = workspaces.find(ws => ws.name === selected);
	const selectedWorkspaceURI = selectedWorkspace?.uri;
	const selectedWorkspaceName = selectedWorkspace?.name;

	if (!selectedWorkspace || !selectedWorkspaceURI || !selectedWorkspaceName) {
		console.log('Invalid workspace selection', selectedWorkspace, selectedWorkspaceURI, selectedWorkspaceName);
		return;
	}

	// Try reading .gitignore
	try {
		const gitignoreURI = vscode.Uri.joinPath(selectedWorkspaceURI, '.gitignore');
		const gitignoreContent = await vscode.workspace.fs.readFile(gitignoreURI);
		const gitignoretext = Buffer.from(gitignoreContent).toString('utf-8');
		ig.add(gitignoretext);
	} catch (err) {
		console.log('.gitignore not found or failed to read');
	}

	// Properly assign the global variable
	workspaceData = { [selectedWorkspaceName]: [], type: 'workspace' };

	const readDirectoryAndLoadData = async (
		selectedDirectoryURI: vscode.Uri,
		selectedDirectoryName: string,
		workspaceArray: any
	) => {
		const directoryContents = await vscode.workspace.fs.readDirectory(selectedDirectoryURI);

		const filteredContents = directoryContents.filter(([name]) => {
			const relativePath = vscode.workspace.asRelativePath(
				vscode.Uri.joinPath(selectedDirectoryURI, name)
			);
			return !ig.ignores(relativePath);
		});

		for (const [name, type] of filteredContents) {
			if (type === vscode.FileType.File) {
				const fileURI = vscode.Uri.joinPath(selectedDirectoryURI, name);
				const fileContentsBuffer = await vscode.workspace.fs.readFile(fileURI);
				const fileContentsText = fileContentsBuffer.toString();

				const chunkSize = 1_000_000;
				let offset = 0;

				let arr: string[] = [];

				while(offset < fileContentsBuffer.length){
					const chunk = fileContentsBuffer.slice(offset, offset+chunkSize);
					arr.push(chunk.toString());
					offset = offset + chunkSize;
				}

				workspaceArray.push({[name]:  arr, type: 'file'});
			} else if (type === vscode.FileType.Directory) {
				const directoryURI = vscode.Uri.joinPath(selectedDirectoryURI, name);
				const newDir: any = [];
				workspaceArray.push({ [name]: newDir, type:'directory' });
				await readDirectoryAndLoadData(directoryURI, name, newDir);
			}
		}
	};

	await readDirectoryAndLoadData(
		selectedWorkspaceURI,
		selectedWorkspaceName,
		workspaceData[selectedWorkspaceName]
	);

	console.log('Final Workspace Data:', workspaceData);
};

export { workspaceData };
