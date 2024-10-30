import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDataContext } from '../context/DataContext';

interface FareCalculatorProps {
  onStationSelect?: (stations: { from: string; to: string }) => void;
}

const FareCalculator: React.FC<FareCalculatorProps> = ({ onStationSelect }) => {
  const { stopsData } = useDataContext();
  const [fromStation, setFromStation] = useState('ALVA'); 
  const [toStation, setToStation] = useState('EDAP'); 

  const stations = stopsData ? stopsData.stops.map((stop: { stop_id: string; stop_name: string }) => ({
    id: stop.stop_id,
    name: stop.stop_name
  })) : [];

  const handleStationChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setFromStation(value);
    } else {
      setToStation(value);
    }

    if (onStationSelect) {
      onStationSelect({
        from: type === 'from' ? value : fromStation,
        to: type === 'to' ? value : toStation,
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white text-center mb-4">Choose Station</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            From 
          </label>
          <select
            value={fromStation}
            onChange={(e) => handleStationChange('from', e.target.value)}
            className="w-full p-3 bg-white/100 text-black backdrop-blur border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select station</option>
            {stations.map((station: { id: string; name: string }) => (
              <option key={station.id} value={station.id} className="text-black">
                {station.name}
              </option>
            ))}
          </select>
          
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            To
          </label>
          <select
            value={toStation}
            onChange={(e) => handleStationChange('to', e.target.value)}
            className="w-full p-3 bg-white/100 text-black backdrop-blur border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select station</option>
            {stations.map((station: { id: string; name: string }) => (
              <option key={station.id} value={station.id} className="text-black">
                {station.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-center mt-4 text-gray-400">
        <AlertCircle size={16} className="mr-2" />
        <p className="text-sm">
          This web app contains data provided by Kochi Metro Rail Limited (KMRL) but is not endorsed by KMRL.
        </p>
      </div>
    </div>
  );
};

export default FareCalculator;
