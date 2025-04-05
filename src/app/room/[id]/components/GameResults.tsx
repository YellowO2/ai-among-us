import { Room, Player } from "@/types/game";

interface GameResultsProps {
  room: Room;
  currentPlayer: Player;
  onPlayAgain: () => void;
}

export default function GameResults({
  room,
  currentPlayer,
  onPlayAgain,
}: GameResultsProps) {
  // Check if humans won (all AI players eliminated)
  const aiPlayers = room.players.filter((p) => p.isAI);
  const eliminatedAI = aiPlayers.filter((p) => p.eliminated);
  const humansWon = eliminatedAI.length === aiPlayers.length;

  // Count remaining players of each type
  const remainingHumans = room.players.filter(
    (p) => !p.isAI && !p.eliminated
  ).length;
  const remainingAI = aiPlayers.length - eliminatedAI.length;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>

        <div
          className={`text-2xl font-bold mb-2 ${
            humansWon ? "text-green-400" : "text-red-400"
          }`}
        >
          {humansWon ? "Humans Win!" : "AI Wins!"}
        </div>

        <p className="text-gray-300">
          {humansWon
            ? "All AI players were successfully identified."
            : "The AI players managed to blend in and survive."}
        </p>
      </div>

      {/* Game stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Rounds Played</div>
          <div className="text-2xl font-bold">
            {room.currentRound} / {room.maxRounds}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Humans Remaining</div>
          <div className="text-2xl font-bold text-blue-400">
            {remainingHumans}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">AI Remaining</div>
          <div className="text-2xl font-bold text-red-400">{remainingAI}</div>
        </div>
      </div>

      {/* Player results */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Player Results</h3>

        <div className="grid gap-3">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                player.isAI ? "bg-red-900/30" : "bg-blue-900/30"
              } ${player.eliminated ? "opacity-70" : ""}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-bold">
                    {player.alias}
                    {player.id === currentPlayer.id && " (You)"}
                  </div>
                  <div>
                    {player.eliminated && (
                      <span className="text-xs bg-red-900 px-1.5 py-0.5 rounded">
                        Eliminated
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-300 mt-1">
                  Real identity:{" "}
                  <span className="font-medium">{player.name}</span>
                  {player.isAI && (
                    <span className="text-red-400 font-medium"> (AI Bot)</span>
                  )}
                </div>
              </div>

              <div className="text-gray-300 text-sm">
                <div>{player.votesReceived} votes received</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onPlayAgain}
          className="px-6 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg font-medium text-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
