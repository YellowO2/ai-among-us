import { useEffect, useState } from "react";
import { GameStatus } from "@/types/game";

interface TimerProps {
  timeLeft: number;
  totalTime: number;
  phase: GameStatus;
}

export default function Timer({ timeLeft, totalTime, phase }: TimerProps) {
  const [percent, setPercent] = useState(100);

  useEffect(() => {
    setPercent(Math.floor((timeLeft / totalTime) * 100));
  }, [timeLeft, totalTime]);

  // Determine color based on time left
  const getColor = () => {
    if (percent > 60) return "bg-green-500";
    if (percent > 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="text-center">
      <div className="text-sm uppercase font-bold mb-1 pixel-text">
        {phase === "answering" ? "Answer Time" : "Voting Time"}
      </div>

      <div className="flex items-center gap-2">
        {/* Timer bar */}
        <div className="w-36 h-6 bg-gray-700 rounded-sm overflow-hidden pixel-border">
          <div
            className={`h-full ${getColor()} transition-all duration-1000 ease-linear`}
            style={{ width: `${percent}%` }}
          ></div>
        </div>

        {/* Time in seconds */}
        <div className="font-mono w-12 text-right pixel-text">{timeLeft}s</div>
      </div>
    </div>
  );
}
