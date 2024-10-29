import React, { useState } from 'react';
import TimeTable from './TimeTable';
import MetroMap from './MetroMap';

interface TimeTableMapLayoutProps {
  fromStation: string;
  toStation: string;
}

const TimeTableMapLayout: React.FC<TimeTableMapLayoutProps> = ({ fromStation, toStation }) => {
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);

  const handleTrainSelect = (tripId: string | null) => {
    setSelectedTrainId(tripId);
  };

  return (
    <div className="flex flex-col md:flex-row max-w-6xl mx-auto">
      <div className="w-full md:w-1/3 p-4">
        <TimeTable fromStation={fromStation} toStation={toStation} onTrainSelect={handleTrainSelect} />
      </div>
      
      <div className="w-full md:w-2/3 p-4">
        <MetroMap selectedStations={{ from: fromStation, to: toStation }} selectedTrainId={selectedTrainId} />
      </div>
    </div>
  );
};

export default TimeTableMapLayout;
