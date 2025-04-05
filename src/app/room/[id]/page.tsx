"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, Player, GameStatus } from "@/types/game";
import {
  startGame,
  submitAnswer,
  submitVote,
  endVotingRound,
} from "@/lib/gameUtils";

// Game Components
import WaitingRoom from "./components/WaitingRoom";
import AnsweringPhase from "./components/AnsweringPhase";
import VotingPhase from "./components/VotingPhase";
import GameResults from "./components/GameResults";
import Timer from "./components/Timer";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  // Load room data and subscribe to real-time updates
  useEffect(() => {
    if (!roomId) return;

    const playerId = localStorage.getItem(`player_${roomId}`);

    const unsubscribe = onSnapshot(
      doc(db, "rooms", roomId),
      (doc) => {
        if (doc.exists()) {
          const roomData = doc.data() as Room;
          setRoom(roomData);

          // Find current player
          if (playerId) {
            const player = roomData.players.find((p) => p.id === playerId);
            if (player) {
              setCurrentPlayer(player);
            }
          }

          // Calculate time left based on game status
          if (roomData.status === "answering" || roomData.status === "voting") {
            const timeAllowed =
              roomData.status === "answering"
                ? roomData.answeringTime
                : roomData.votingTime;

            const elapsed = Math.floor(
              (Date.now() - roomData.roundStartTime) / 1000
            );
            const remaining = Math.max(0, timeAllowed - elapsed);
            setTimeLeft(remaining);
          }

          setLoading(false);
        } else {
          setError("Room not found");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error loading room:", err);
        setError("Failed to load game room");
        setLoading(false);
      }
    );

    // Set up timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [roomId]);

  // Handle timer completion
  useEffect(() => {
    if (!room || !currentPlayer) return;

    if (timeLeft <= 0) {
      // Time's up - handle based on game status
      if (room.status === "answering") {
        // If player hasn't answered, submit an empty answer
        const hasAnswered = currentPlayer.answers.some(
          (a) => a.round === room.currentRound
        );
        if (!hasAnswered && currentPlayer.isHost) {
          submitAnswer(roomId, currentPlayer.id, "Time ran out!");
        }
      } else if (room.status === "voting" && currentPlayer.isHost) {
        // Only host triggers the end of voting round
        endVotingRound(roomId);
      }
    }
  }, [timeLeft, room, currentPlayer, roomId]);

  // Start the game - only host can do this
  const handleStartGame = async () => {
    if (room && currentPlayer?.isHost) {
      await startGame(roomId);
    }
  };

  // Submit player's answer
  const handleSubmitAnswer = async (answer: string) => {
    if (room && currentPlayer) {
      await submitAnswer(roomId, currentPlayer.id, answer);
    }
  };

  // Submit player's vote
  const handleVote = async (votedPlayerId: string, add: boolean) => {
    if (room && currentPlayer) {
      await submitVote(roomId, currentPlayer.id, votedPlayerId, add);
    }
  };

  // Render appropriate component based on game status
  const renderGameState = () => {
    if (!room || !currentPlayer) return null;

    switch (room.status) {
      case "waiting":
        return (
          <WaitingRoom
            room={room}
            currentPlayer={currentPlayer}
            onStartGame={handleStartGame}
          />
        );
      case "answering":
        return (
          <AnsweringPhase
            room={room}
            currentPlayer={currentPlayer}
            timeLeft={timeLeft}
            onSubmitAnswer={handleSubmitAnswer}
          />
        );
      case "voting":
        return (
          <VotingPhase
            room={room}
            currentPlayer={currentPlayer}
            timeLeft={timeLeft}
            onVote={handleVote}
          />
        );
      case "ended":
        return (
          <GameResults
            room={room}
            currentPlayer={currentPlayer}
            onPlayAgain={() => router.push("/")}
          />
        );
      default:
        return <div>Unknown game state</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pixel-bg flex items-center justify-center">
        <div className="text-center pixel-card p-8 rounded-lg">
          <div className="typing-animation pixel-text text-xl">
            Loading game...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pixel-bg flex items-center justify-center">
        <div className="text-center pixel-card p-8 rounded-lg">
          <div className="text-red-400 pixel-text text-xl mb-4">{error}</div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded font-medium pixel-button"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pixel-bg text-white p-4">
      {room && (
        <div className="max-w-4xl mx-auto">
          {/* Game Header */}
          <div className="pixel-card rounded-lg p-4 mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold pixel-text">
                Find the Fake Human
              </h1>
              <div className="text-sm text-gray-400">
                Room Code:{" "}
                <span className="font-mono font-bold">{room.code}</span>
              </div>
            </div>

            {(room.status === "answering" || room.status === "voting") && (
              <Timer
                timeLeft={timeLeft}
                totalTime={
                  room.status === "answering"
                    ? room.answeringTime
                    : room.votingTime
                }
                phase={room.status}
              />
            )}

            <div>
              <div className="text-sm text-gray-400 pixel-text">Playing as</div>
              <div className="font-bold pixel-text">{currentPlayer?.alias}</div>
            </div>
          </div>

          {/* Main Game Area */}
          <div className="pixel-border">{renderGameState()}</div>
        </div>
      )}
    </div>
  );
}
