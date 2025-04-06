"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, Player } from "@/types/game";
import {
  startGame,
  submitAnswer,
  submitVote,
  endVotingRound,
  checkAndUpdateGameState,
} from "@/lib/gameUtils";

// Game Components
import WaitingRoom from "./components/WaitingRoom";
import AnsweringPhase from "./components/AnsweringPhase";
import VotingPhase from "./components/VotingPhase";
import GameResults from "./components/GameResults";
import Timer from "./components/Timer";
import PhaseTransition from "./components/PhaseTransition";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");
  const prevStatus = useRef<string | null>(null);
  const prevRound = useRef<number | null>(null);

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

  // Add a timer effect to check game state periodically
  useEffect(() => {
    if (!room || room.status === "waiting" || room.status === "ended") {
      return; // Don't run timer if game hasn't started or is already over
    }

    // Check every 3 seconds if the timer has expired
    const intervalId = setInterval(async () => {
      const updatedRoom = await checkAndUpdateGameState(roomId);
      if (
        updatedRoom &&
        (updatedRoom.status !== room.status ||
          updatedRoom.currentRound !== room.currentRound)
      ) {
        setRoom(updatedRoom);
      }
    }, 3000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [room, roomId]);

  // Start the game - only host can do this
  const handleStartGame = async () => {
    if (room && currentPlayer?.isHost) {
      await startGame(roomId);
    }
  };

  // Submit player's answer with phase transition
  const handleSubmitAnswer = async (answer: string) => {
    if (room && currentPlayer) {
      try {
        // Check if this player is the last human to answer
        const isLastHumanToAnswer = checkIfLastHumanToAnswer(
          room,
          currentPlayer
        );

        if (isLastHumanToAnswer) {
          // Show transition while AI generates responses
          setTransitionMessage("Processing answers...");
          setShowTransition(true);
        }

        // Submit the answer
        await submitAnswer(
          roomId,
          currentPlayer.id,
          answer,
          isLastHumanToAnswer
        );

        // If we displayed the transition, hide it after a delay
        if (isLastHumanToAnswer) {
          setTimeout(() => {
            setShowTransition(false);
          }, 2500);
        }
      } catch (error) {
        console.error("Error submitting answer:", error);
        setShowTransition(false);
      }
    }
  };

  // Check if this player is the last human to answer
  const checkIfLastHumanToAnswer = (room: Room, player: Player): boolean => {
    // Get all non-eliminated human players
    const humanPlayers = room.players.filter((p) => !p.isAI && !p.eliminated);

    // Count how many have already answered for this round
    const alreadyAnswered = humanPlayers.filter(
      (p) =>
        p.id !== player.id && // Exclude current player
        p.answers.some((a) => a.round === room.currentRound)
    ).length;

    // If all other humans have answered, this player is the last one
    return alreadyAnswered === humanPlayers.length - 1;
  };

  // Add effect to handle phase transitions
  useEffect(() => {
    if (!room) return;

    // Check for status changes
    if (prevStatus.current && prevStatus.current !== room.status) {
      if (room.status === "voting") {
        setTransitionMessage("Voting phase starting...");
        setShowTransition(true);
        setTimeout(() => setShowTransition(false), 1500);
      } else if (
        room.status === "answering" &&
        prevStatus.current === "voting"
      ) {
        setTransitionMessage(`Round ${room.currentRound} beginning...`);
        setShowTransition(true);
        setTimeout(() => setShowTransition(false), 1500);
      }
    }

    // Update refs for next comparison
    prevStatus.current = room.status;
    prevRound.current = room.currentRound;
  }, [room?.status, room?.currentRound]);

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
          <div className="text-red-400 text-xl mb-4">{error}</div>
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

          {/* Phase transition overlay */}
          {showTransition && <PhaseTransition message={transitionMessage} />}
        </div>
      )}
    </div>
  );
}
