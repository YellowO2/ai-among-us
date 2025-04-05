import { useState, useEffect } from "react";
import { Room, Player } from "@/types/game";

interface AnsweringPhaseProps {
  room: Room;
  currentPlayer: Player;
  timeLeft: number;
  onSubmitAnswer: (answer: string) => void;
}

export default function AnsweringPhase({
  room,
  currentPlayer,
  timeLeft,
  onSubmitAnswer,
}: AnsweringPhaseProps) {
  const [answer, setAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [playersAnswered, setPlayersAnswered] = useState(0);
  const currentQuestion = room.currentQuestion?.text || "Loading question...";

  useEffect(() => {
    // Check if player has already answered this round
    const playerAnswer = currentPlayer.answers.find(
      (a) => a.round === room.currentRound
    );
    if (playerAnswer) {
      setAnswer(playerAnswer.content);
      setHasAnswered(true);
    } else {
      setAnswer("");
      setHasAnswered(false);
    }

    // Count how many players have answered
    const answered = room.players.filter(
      (p) =>
        p.answers.some((a) => a.round === room.currentRound) || p.eliminated
    ).length;

    setPlayersAnswered(answered);
  }, [room, currentPlayer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnswered && answer.trim()) {
      onSubmitAnswer(answer);
      setHasAnswered(true);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
      {/* Round info */}
      <div className="flex justify-between mb-6">
        <div className="bg-purple-900/50 px-4 py-2 rounded-lg">
          <span className="font-medium">Round {room.currentRound}</span>
          <span className="text-sm text-gray-300"> of {room.maxRounds}</span>
        </div>

        <div className="bg-blue-900/50 px-4 py-2 rounded-lg">
          <span className="font-medium">{playersAnswered}</span>
          <span className="text-sm text-gray-300">
            {" "}
            of {room.players.length} answered
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Question:</h2>
        <p className="text-lg">{currentQuestion}</p>
      </div>

      {/* Answer form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label
            htmlFor="answer"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Your Answer:
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={hasAnswered}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70 min-h-[120px]"
            placeholder="Type your answer here..."
          />
        </div>

        {hasAnswered ? (
          <div className="text-center">
            <div className="bg-green-900/40 text-green-300 p-3 rounded-lg">
              <span className="font-medium">
                Your answer has been submitted!
              </span>
              <p className="text-sm text-gray-300 mt-1">
                Waiting for other players to answer...
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              type="submit"
              disabled={!answer.trim()}
              className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              Submit Answer
            </button>
            <p className="text-sm text-gray-400 mt-2">
              Time remaining: {timeLeft} seconds
            </p>
          </div>
        )}
      </form>

      {/* Player status */}
      <div className="mt-8">
        <h3 className="text-sm uppercase font-semibold text-gray-400 mb-2">
          Players
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={`text-center p-2 rounded-lg ${
                player.eliminated
                  ? "bg-red-900/30 text-gray-400"
                  : player.answers.some((a) => a.round === room.currentRound)
                  ? "bg-green-900/30"
                  : "bg-gray-700"
              }`}
            >
              <div className="font-medium truncate">
                {player.alias}
                {player.id === currentPlayer.id && " (You)"}
              </div>
              <div className="text-xs">
                {player.eliminated
                  ? "Eliminated"
                  : player.answers.some((a) => a.round === room.currentRound)
                  ? "Answered"
                  : "Thinking..."}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
