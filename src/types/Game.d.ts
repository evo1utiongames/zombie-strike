interface ReplicatedStorage {
	Assets: Folder & {
		Bosses: Folder & {
			Samurai: Folder & {
				Boss: Folder & {
					Crescent: BasePart,
				},
			},
		},

		Campaign: Folder & {
			[name: string]: Folder,
		},
	},

	BossSequences: Folder & {
		[name: string]: ModuleScript,
	},

	Remotes: Folder & {
		RotatingBoss: Folder,
		SendServerLogs: RemoteEvent,
	},
}

interface ServerScriptService {
	BossLocalScripts: Folder & {
		[name: string]: Folder,
	}
}

interface ServerStorage {
	BossRooms: Folder & {
		[name: string]: Model,
	},
}

interface StarterPlayer {
	StarterPlayerScripts: Folder,
}
