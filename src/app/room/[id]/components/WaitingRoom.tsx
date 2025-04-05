import { Room, Player } from "@/types/game";

interface WaitingRoomProps {
  room: Room;
  currentPlayer: Player;
  onStartGame: () => void;
}

export default function WaitingRoom({
  room,
  currentPlayer,
  onStartGame,
}: WaitingRoomProps) {
  const isHost = currentPlayer.isHost;
  const playerCount = room.players.length;
  const minimumPlayers = 2; // At least 2 real players + 1 AI

  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center">Waiting Room</h2>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Players</h3>
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
            {playerCount} joined
          </span>
        </div>

        <div className="grid gap-2 md:grid-cols-2 max-h-80 overflow-y-auto pb-2">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                player.id === currentPlayer.id
                  ? "bg-blue-800 border border-blue-600"
                  : "bg-gray-700"
              }`}
            >
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-bold">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{player.name}</div>
                {player.isHost && (
                  <span className="text-xs bg-purple-700 px-1.5 py-0.5 rounded text-white">
                    Host
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">Game Setup</h3>
        <div className="flex justify-between mb-1">
          <span>Number of AI Players:</span>
          <span className="font-mono">{room.aiCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Room Code:</span>
          <span className="font-mono font-bold">{room.code}</span>
        </div>
      </div>

      {isHost ? (
        <div className="text-center">
          <button
            onClick={onStartGame}
            disabled={playerCount < minimumPlayers}
            className={`px-6 py-3 rounded-lg font-medium text-lg transition-colors duration-200 ${
              playerCount >= minimumPlayers
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            {playerCount >= minimumPlayers
              ? "Start Game"
              : `Need at least ${minimumPlayers} players`}
          </button>
          {playerCount < minimumPlayers && (
            <p className="mt-2 text-sm text-gray-400">
              Share the room code with friends to play!
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-pulse">
            <p className="text-lg">Waiting for host to start the game...</p>
          </div>
        </div>
      )}
    </div>
  );
}
