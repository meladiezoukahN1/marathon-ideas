import React from "react";

export function TimerDisplay({ time }: { time: number }) {
  // Simple MM:SS formatting
  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (time % 60).toString().padStart(2, "0");

  return (
    <div className="text-4xl font-mono font-bold text-center">
      {minutes}:{seconds}
    </div>
  );
}
