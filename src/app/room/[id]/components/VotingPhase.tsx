import { useState, useEffect } from "react";
import { Room, Player } from "@/types/game";

interface VotingPhaseProps {
  room: Room;
  currentPlayer: Player;
  timeLeft: number;
  onVote: (playerId: string, add: boolean) => void;
}

export default function VotingPhase({
  room,
  currentPlayer,
  timeLeft,
  onVote,
}: VotingPhaseProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  useEffect(() => {
    // Initialize with any existing votes
    setSelectedPlayers(currentPlayer.votes || []);
  }, [currentPlayer]);

  const handleVote = (playerId: string) => {
    // Don't allow voting for yourself or eliminated players
    const targetPlayer = room.players.find((p) => p.id === playerId);
    if (playerId === currentPlayer.id || targetPlayer?.eliminated) return;

    const isSelected = selectedPlayers.includes(playerId);

    if (isSelected) {
      // Remove vote
      const newSelected = selectedPlayers.filter((id) => id !== playerId);
      setSelectedPlayers(newSelected);
      onVote(playerId, false);
    } else {
      // Add vote if under limit (2 votes)
      if (selectedPlayers.length < 2) {
        setSelectedPlayers([...selectedPlayers, playerId]);
        onVote(playerId, true);
      }
    }
  };

  // Get current round answers for each player
  const getCurrentRoundAnswers = () => {
    return room.players.map((player) => {
      const answer = player.answers.find((a) => a.round === room.currentRound);
      return {
        player,
        answer: answer?.content || "No answer provided",
      };
    });
  };

  const playerAnswers = getCurrentRoundAnswers();
  const votesRemaining = 2 - selectedPlayers.length;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
      {/* Round info */}
      <div className="flex justify-between mb-6">
        <div className="bg-purple-900/50 px-4 py-2 rounded-lg">
          <span className="font-medium">Round {room.currentRound}</span>
          <span className="text-sm text-gray-300"> of {room.maxRounds}</span>
        </div>

        <div className="bg-red-900/50 px-4 py-2 rounded-lg">
          <span className="font-medium">Votes remaining: {votesRemaining}</span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Question:</h2>
        <p className="text-lg">
          {room.currentQuestion?.text || "Loading question..."}
        </p>
      </div>

      {/* Voting instructions */}
      <div className="bg-blue-900/30 p-4 rounded-lg mb-6">
        <p className="font-medium">Vote for who you think is the AI!</p>
        <p className="text-sm text-gray-300 mt-1">
          Read everyone's answers carefully. You can vote for up to 2 players.
        </p>
      </div>

      {/* Player answers for voting */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold">Player Answers</h3>

        <div className="grid gap-4">
          {playerAnswers.map(({ player, answer }) => (
            <div
              key={player.id}
              className={`p-4 rounded-lg transition-colors ${
                player.eliminated
                  ? "bg-red-900/20 text-gray-400"
                  : player.id === currentPlayer.id
                  ? "bg-blue-900/30"
                  : selectedPlayers.includes(player.id)
                  ? "bg-yellow-900/30 border border-yellow-500"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() =>
                player.id !== currentPlayer.id &&
                !player.eliminated &&
                handleVote(player.id)
              }
            >
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold">
                  {player.alias}
                  {player.id === currentPlayer.id && " (You)"}
                  {player.eliminated && " (Eliminated)"}
                </div>

                {!player.eliminated && player.id !== currentPlayer.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(player.id);
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPlayers.includes(player.id)
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : votesRemaining > 0
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                    disabled={
                      !selectedPlayers.includes(player.id) &&
                      votesRemaining === 0
                    }
                  >
                    {selectedPlayers.includes(player.id) ? "Unvote" : "Vote"}
                  </button>
                )}
              </div>

              <div className="bg-gray-800 p-3 rounded">
                <p className="text-gray-300">{answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-gray-400">
        <p>Time remaining: {timeLeft} seconds</p>
      </div>
    </div>
  );
}
