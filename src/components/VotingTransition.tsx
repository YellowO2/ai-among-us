import React from "react";

interface VotingTransitionProps {
  isVisible: boolean;
}

const VotingTransition: React.FC<VotingTransitionProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="text-center p-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600">
        <h2 className="text-3xl font-bold text-white mb-3">
          Voting Phase Starting...
        </h2>
        <div className="flex justify-center my-4">
          <div className="w-16 h-16 border-t-4 border-blue-200 border-solid rounded-full animate-spin"></div>
        </div>
        <p className="text-white text-xl">
          All responses submitted! Get ready to vote.
        </p>
      </div>
    </div>
  );
};

export default VotingTransition;
