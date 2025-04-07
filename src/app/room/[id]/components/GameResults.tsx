import { Room, Player } from "@/types/game";
import { playSound } from "@/lib/soundUtils";
import { useEffect, useMemo } from "react";

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
  // Use the humansWon flag from room if available
  const humansWon = room.humansWon ?? false;
  
  // Play appropriate sound when results are shown
  useEffect(() => {
    playSound(humansWon ? "win" : "lose");
  }, [humansWon]);

  // Sort players by total votes received (highest to lowest)
  const sortedPlayers = useMemo(() => {
    return [...room.players].sort(
      (a, b) => (b.totalVotesReceived || 0) - (a.totalVotesReceived || 0)
    );
  }, [room.players]);

  // Handle Play Again with sound
  const handlePlayAgain = () => {
    playSound("click");
    onPlayAgain();
  };

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
          {room.gameResult || (humansWon 
            ? "All AI players were successfully identified."
            : "The AI players managed to blend in with the humans.")}
        </p>
      </div>

      {/* Game stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Rounds Played</div>
          <div className="text-2xl font-bold">
            {room.currentRound} / {room.maxRounds}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">AI Players</div>
          <div className="text-2xl font-bold text-red-400">
            {room.aiCount}
          </div>
        </div>
      </div>

      {/* Player results - sorted by votes */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Player Results (by total votes)</h3>

        <div className="grid gap-3">
          {sortedPlayers.map((player, index) => {
            // Highlight top N players where N is the AI count
            const isTopVoted = index < room.aiCount;
            
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  player.isAI ? "bg-red-900/30" : "bg-blue-900/30"
                } ${
                  isTopVoted ? "border-2 border-yellow-500" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold">
                      {player.alias}
                      {player.id === currentPlayer.id && " (You)"}
                      {isTopVoted && (
                        <span className="text-yellow-400 ml-2">
                          #{index + 1} Most Votes
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

                <div className="text-gray-300 text-right">
                  <div className="font-bold text-lg">{player.totalVotesReceived || 0}</div>
                  <div className="text-xs">Total Votes</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handlePlayAgain}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
