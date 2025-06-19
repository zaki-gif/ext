export type RoomData = {
    workspaceData: number[][] | null;
    users: Array<string>;
};

export type UserData = {
    roomCode: string;
    host: boolean;
};

export const activeRooms = new Map<string, RoomData>();
export const activeUsers = new Map<string, UserData>();

function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return code;
}

export function createUniqueRoomCode(socketId: string) {
    let code;
    do {
        code = generateRoomCode();
    } while (activeRooms.has(code));

    activeRooms.set(code, {
        workspaceData: [],
        users: [socketId],
    });

    activeUsers.set(socketId, {
        roomCode: code,
        host: true,
    });

    return code;
}
