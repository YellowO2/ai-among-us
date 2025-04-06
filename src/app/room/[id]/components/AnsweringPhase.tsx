import { useState, useEffect, useRef } from "react";
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
  // Keep the answer in local state
  const [answer, setAnswer] = useState("");
  // Track if user has already submitted
  const [submitted, setSubmitted] = useState(false);
  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);

  // Check if player has already answered this round
  const hasAnswered = currentPlayer.answers.some(
    (a) => a.round === room.currentRound
  );

  // When component mounts/unmounts
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset form state when round changes
  useEffect(() => {
    if (isMounted.current) {
      setAnswer("");
      setSubmitted(hasAnswered);
    }
  }, [room.currentRound, hasAnswered]);

  // Don't reset answer when room updates for other reasons
  // This is key to prevent losing state on each Firebase update

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnswered && answer.trim() !== "") {
      onSubmitAnswer(answer.trim());
      setSubmitted(true);
      // Don't clear the answer here, let the user see what they submitted
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Round {room.currentRound}</h2>
        <p className="text-lg text-gray-300">Answer the question truthfully!</p>
      </div>

      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <p className="text-xl">{room.currentQuestion?.text}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            className="w-full h-32 p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={hasAnswered || submitted}
            required
          ></textarea>
        </div>

        {!hasAnswered && !submitted ? (
          <div className="text-center">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              disabled={answer.trim() === ""}
            >
              Submit Answer
            </button>
          </div>
        ) : (
          <div className="text-center text-green-500">
            Your answer has been submitted!
          </div>
        )}

        {/* Stats about who has answered */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Players</h3>
          <div className="grid grid-cols-2 gap-2">
            {room.players
              .filter((p) => !p.eliminated)
              .map((player) => {
                const playerAnswered = player.answers.some(
                  (a) => a.round === room.currentRound
                );
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-2 p-2 rounded ${
                      playerAnswered ? "bg-gray-700" : "bg-gray-800"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        playerAnswered ? "bg-green-500" : "bg-gray-500"
                      }`}
                    ></div>
                    <span>
                      {player.alias}
                      {player.id === currentPlayer.id && " (You)"}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </form>
    </div>
  );
}
