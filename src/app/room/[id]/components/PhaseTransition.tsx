import React from "react";

interface PhaseTransitionProps {
  message: string;
}

export default function PhaseTransition({ message }: PhaseTransitionProps) {
  return (
    <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="text-center p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 pixel-text">{message}</h2>
        <div className="flex justify-center space-x-2">
          <div
            className="w-4 h-4 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="w-4 h-4 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-4 h-4 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
