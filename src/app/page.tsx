"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createRoom, joinRoom } from "@/lib/gameUtils";

export default function Home() {
  const [view, setView] = useState<"main" | "create" | "join">("main");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [aiCount, setAiCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const room = await createRoom(playerName, aiCount);
      // Store player ID in local storage
      localStorage.setItem(`player_${room.id}`, room.players[0].id);
      // Navigate to the game room
      router.push(`/room/${room.id}`);
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const room = await joinRoom(roomCode, playerName);
      if (room) {
        // Find the player we just added
        const player = room.players.find(
          (p) => p.name === playerName && !p.isHost
        );
        if (player) {
          // Store player ID in local storage
          localStorage.setItem(`player_${room.id}`, player.id);
          // Navigate to the game room
          router.push(`/room/${room.id}`);
        }
      } else {
        setError("Room not found or game already started");
      }
    } catch (err) {
      setError("Failed to join room. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pixel-bg flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-yellow-400 tracking-wide pixel-text">
            FIND THE FAKE HUMAN
          </h1>
          <p className="text-lg text-gray-300 pixel-text">
            Can you spot the AI among us?
          </p>
        </div>

        {view === "main" && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setView("create")}
              className="px-6 py-3 rounded-lg font-medium text-lg transition-colors duration-200 pixel-button"
            >
              Create Game
            </button>
            <button
              onClick={() => setView("join")}
              className="px-6 py-3 rounded-lg font-medium text-lg transition-colors duration-200 pixel-button"
            >
              Join Game
            </button>
          </div>
        )}

        {view === "create" && (
          <form
            onSubmit={handleCreateRoom}
            className="pixel-card p-6 rounded-xl"
          >
            <h2 className="text-xl font-bold mb-4 text-center pixel-text">
              Create New Game
            </h2>

            <div className="mb-4">
              <label
                htmlFor="playerName"
                className="block text-gray-300 mb-1 pixel-text"
              >
                Your Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
                className="w-full px-4 py-2 rounded pixel-input"
                placeholder="Enter your name"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="aiCount"
                className="block text-gray-300 mb-1 pixel-text"
              >
                Number of AI Players
              </label>
              <select
                id="aiCount"
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                className="w-full px-4 py-2 rounded pixel-input"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-red-400 mb-4 text-center pixel-text">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setView("main")}
                className="flex-1 px-4 py-2 rounded font-medium pixel-button"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !playerName}
                className={`flex-1 px-4 py-2 rounded font-medium pixel-button ${
                  isLoading || !playerName ? "opacity-50" : ""
                }`}
              >
                {isLoading ? "Creating..." : "Create Game"}
              </button>
            </div>
          </form>
        )}

        {view === "join" && (
          <form onSubmit={handleJoinRoom} className="pixel-card p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-center pixel-text">
              Join Game
            </h2>

            <div className="mb-4">
              <label
                htmlFor="playerName"
                className="block text-gray-300 mb-1 pixel-text"
              >
                Your Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
                className="w-full px-4 py-2 rounded pixel-input"
                placeholder="Enter your name"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="roomCode"
                className="block text-gray-300 mb-1 pixel-text"
              >
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                className="w-full px-4 py-2 rounded pixel-input tracking-widest text-center font-bold"
                placeholder="XXXXXX"
              />
            </div>

            {error && (
              <p className="text-red-400 mb-4 text-center pixel-text">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setView("main")}
                className="flex-1 px-4 py-2 rounded font-medium pixel-button"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={
                  isLoading || !playerName || !roomCode || roomCode.length < 6
                }
                className={`flex-1 px-4 py-2 rounded font-medium pixel-button ${
                  isLoading || !playerName || !roomCode || roomCode.length < 6
                    ? "opacity-50"
                    : ""
                }`}
              >
                {isLoading ? "Joining..." : "Join Game"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-12 text-center text-gray-400 text-sm pixel-text">
          <p>A game of deception and deduction</p>
          <p className="mt-1">Find the AI before time runs out!</p>
        </div>
      </div>
    </div>
  );
}
