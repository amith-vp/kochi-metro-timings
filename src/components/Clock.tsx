import React from 'react';
import { Clock as ClockIcon } from 'lucide-react';

interface ClockProps {
  currentTime: Date;
}

export const Clock: React.FC<ClockProps> = ({ currentTime }) => {
  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <div className="flex items-center justify-center space-x-2 text-gray-700">
      <ClockIcon size={20} />
      <span className="font-mono text-lg">{timeString}</span>
    </div>
  );
};
