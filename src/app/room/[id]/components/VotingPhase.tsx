import { useState, useEffect, useRef } from "react";
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
  // Local state to track selected players for voting
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  // Use a ref to track if component is mounted
  const isMounted = useRef(true);
  // Get max votes allowed
  const maxVotesPerPlayer =
    room.maxVotesPerPlayer || (room.players.length <= 5 ? 1 : 2);

  // Initialize selected players from current player's votes on mount
  useEffect(() => {
    isMounted.current = true;
    if (currentPlayer.votes.length > 0 && selectedPlayers.length === 0) {
      setSelectedPlayers([...currentPlayer.votes]);
    }
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update selected players when currentPlayer.votes changes
  useEffect(() => {
    if (
      isMounted.current &&
      JSON.stringify(currentPlayer.votes.sort()) !==
        JSON.stringify(selectedPlayers.sort())
    ) {
      setSelectedPlayers([...currentPlayer.votes]);
    }
  }, [currentPlayer.votes]);

  // Handle vote toggling with local state management
  const handleVoteToggle = (playerId: string) => {
    // Check if already voted for this player
    const alreadySelected = selectedPlayers.includes(playerId);

    if (alreadySelected) {
      // Remove vote
      const newSelected = selectedPlayers.filter((id) => id !== playerId);
      setSelectedPlayers(newSelected);
      onVote(playerId, false);
    } else {
      // Add vote if under max votes
      if (selectedPlayers.length < maxVotesPerPlayer) {
        const newSelected = [...selectedPlayers, playerId];
        setSelectedPlayers(newSelected);
        onVote(playerId, true);
      }
    }
  };

  // Find all players' answers for this round
  const currentRoundAnswers = room.players.reduce((acc, player) => {
    const answer = player.answers.find((a) => a.round === room.currentRound);
    if (answer) {
      acc[player.id] = {
        player,
        answer: answer.content,
      };
    }
    return acc;
  }, {} as Record<string, { player: Player; answer: string }>);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Vote for the AI</h2>
        <p className="text-lg text-gray-300">
          Who do you think is an AI bot? You can vote for {maxVotesPerPlayer}{" "}
          player{maxVotesPerPlayer > 1 ? "s" : ""}.
        </p>
      </div>

      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <p className="text-lg font-medium mb-2">Question:</p>
        <p>{room.currentQuestion?.text}</p>
      </div>

      <div className="space-y-6">
        {room.players
          .filter(
            (player) => !player.eliminated && player.id !== currentPlayer.id
          )
          .map((player) => {
            const playerData = currentRoundAnswers[player.id];
            const isSelected = selectedPlayers.includes(player.id);

            return (
              <div
                key={player.id}
                className={`border ${
                  isSelected ? "border-blue-500" : "border-gray-700"
                } rounded-lg p-4 transition-colors`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">{player.alias}</h3>
                  <button
                    onClick={() => handleVoteToggle(player.id)}
                    className={`px-4 py-1 rounded-md font-medium ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    } ${
                      selectedPlayers.length >= maxVotesPerPlayer && !isSelected
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={
                      selectedPlayers.length >= maxVotesPerPlayer && !isSelected
                    }
                  >
                    {isSelected ? "Selected" : "Select"}
                  </button>
                </div>

                <div className="bg-gray-800 p-3 rounded-md mt-2">
                  <p>{playerData?.answer || "No answer provided"}</p>
                </div>
              </div>
            );
          })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          {selectedPlayers.length}/{maxVotesPerPlayer} votes used
        </p>
      </div>
    </div>
  );
}
