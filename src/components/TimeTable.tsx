import React, { useState, useEffect } from 'react';
import { useDataContext } from '../context/DataContext';
import { Timer, SignpostBig, Calendar, Clock, Tag, Train, ArrowLeft, ChevronRight, Hourglass } from "lucide-react";

interface Train {
  tripId: string;
  departureStation: string;
  destinationStation: string;
  departureTime: string;
  destinationTime: string;
  direction: string; 
}

interface TimeTableProps {
  fromStation: string;
  toStation: string;
  onTrainSelect: (tripId: string | null) => void;  
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const TimeTable: React.FC<TimeTableProps> = ({ fromStation, toStation, onTrainSelect }) => {
  const { stopTimesData, stopsData, calendarData, fareData, tripsData } = useDataContext();

  const [nextTrains, setNextTrains] = useState<Train[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });

  const stationNameMap = stopsData ? stopsData.stops.reduce((map: Record<string, string>, stop: { stop_id: string; stop_name: string }) => {
    map[stop.stop_id] = stop.stop_name;
    return map;
  }, {} as Record<string, string>) : {};

  const formatTime = (time: string, includeSeconds: boolean = false) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = ((hours + 11) % 12 + 1);
    const formattedTime = `${formattedHours}:${minutes.toString().padStart(2, '0')}`;
    return includeSeconds ? `${formattedTime}:${seconds.toString().padStart(2, '0')} ${suffix}` : `${formattedTime} ${suffix}`;
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const calculateFare = (from: string, to: string) => {
    if (!fareData) return null;
    for (const fare of fareData.fares) {
      if ((fare.rules as Record<string, string[]>)[from]?.includes(to)) {
        return fare.price;
      }
    }
    return null;
  };

  const calculateDuration = (departure: string, destination: string) => {
    const [depHours, depMinutes] = departure.split(':').map(Number);
    const [destHours, destMinutes] = destination.split(':').map(Number);
    const durationMinutes = (destHours * 60 + destMinutes) - (depHours * 60 + depMinutes);
    return `${durationMinutes} Mins`;
  };

  useEffect(() => {
    if (!fromStation || !toStation || !stopTimesData || !tripsData || !calendarData) return;

    const [selectedHours, selectedMinutes] = selectedTime.split(':').map(Number);
    const currentDay = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as DayOfWeek;

    const getNextTrains = () => {
      const trains: Train[] = stopTimesData.trips.flatMap((trip: any) => {
        const fromIndex = trip.trip.stops.findIndex((stop: any) => stop[0] === fromStation);
        const toIndex = trip.trip.stops.findIndex((stop: any) => stop[0] === toStation);

        if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) return [];

        const departureTime = trip.trip.stops[fromIndex][2].toString();
        const destinationTime = trip.trip.stops[toIndex][2].toString();
        const [hours, minutes] = (departureTime as string).split(':').map(Number);

        if (hours < selectedHours || (hours === selectedHours && minutes <= selectedMinutes)) return [];

        const serviceId = trip.trip.id.startsWith('WE') ? 'WE' : 'WK';
        const isSunday = currentDay === 'sunday';
        if ((serviceId === 'WE' && !isSunday) || (serviceId === 'WK' && isSunday)) return [];

        const tripData = tripsData.trips.find((t: any) => t.trip_id === trip.trip.id);
        const direction = tripData?.direction_id === 0 ? 'Tripunithura' : 'Aluva';

        return [{
          tripId: trip.trip.id,
          departureStation: trip.trip.stops[fromIndex][0] as string,
          destinationStation: trip.trip.stops[toIndex][0] as string,
          departureTime: trip.trip.stops[fromIndex][2].toString(),
          destinationTime: destinationTime,
          direction: direction
        }];
      });

      const uniqueTrains = trains.reduce((acc, current) => {
        const x = acc.find(item => item.tripId === current.tripId);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, [] as Train[]);

      return uniqueTrains.sort((a, b) => {
        const [aHours, aMinutes] = a.departureTime.split(':').map(Number);
        const [bHours, bMinutes] = b.departureTime.split(':').map(Number);
        return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
      }).slice(0, 6);
    };

    setNextTrains(getNextTrains());
    setSelectedTrip(null);
  }, [fromStation, toStation, selectedDate, selectedTime, stopTimesData, tripsData, calendarData]);

  const getIntermediateStops = (tripId: string) => {
    if (!stopTimesData) return [];
    const trip = stopTimesData.trips.find((trip: any) => trip.trip.id === tripId);
    if (!trip) return [];

    const fromIndex = trip.trip.stops.findIndex((stop: any) => stop[0] === fromStation);
    const toIndex = trip.trip.stops.findIndex((stop: any) => stop[0] === toStation);

    return [
      {
        stopName: stationNameMap[fromStation],
        arrivalTime: trip.trip.stops[fromIndex][1].toString(),
        departureTime: trip.trip.stops[fromIndex][2].toString(),
        waitingTime: calculateWaitingTime(trip.trip.stops[fromIndex][1].toString(), trip.trip.stops[fromIndex][2].toString())
      },
      ...trip.trip.stops.slice(fromIndex + 1, toIndex).map((stop: any) => ({
        stopName: stationNameMap[stop[0]],
        arrivalTime: stop[1].toString(),
        departureTime: stop[2].toString(),
        waitingTime: calculateWaitingTime(stop[1].toString(), stop[2].toString())
      })),
      {
        stopName: stationNameMap[toStation],
        arrivalTime: trip.trip.stops[toIndex][1].toString(),
        departureTime: trip.trip.stops[toIndex][2].toString(),
        waitingTime: calculateWaitingTime(trip.trip.stops[toIndex][1].toString(), trip.trip.stops[toIndex][2].toString())
      }
    ];
  };

  const calculateWaitingTime = (arrival: string, departure: string) => {
    const [arrHours, arrMinutes, arrSeconds] = arrival.split(':').map(Number);
    const [depHours, depMinutes, depSeconds] = departure.split(':').map(Number);
    const waitingSeconds = (depHours * 3600 + depMinutes * 60 + depSeconds) - (arrHours * 3600 + arrMinutes * 60 + arrSeconds);
    if (waitingSeconds < 60) {
      return `${waitingSeconds} Secs`;
    } else {
      const minutes = Math.floor(waitingSeconds / 60);
      return `${minutes} Mins`;
    }
  };

  useEffect(() => {
    if (selectedTrip && getIntermediateStops(selectedTrip).length === 0) {
      setSelectedTrip(null);
      onTrainSelect(null);
    }
  }, [selectedTrip, fromStation, toStation]);

  return (
    <div className="max-w-4xl mx-auto h-full">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full">
        <div className="p-6 border-b">
          <div className="flex gap-4 items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Schedules
            </h2>
          </div>
          <div className="flex gap-4 items-center mt-4">
            <div className="flex gap-2 items-center">
              <input
                type="date"
                id="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="border rounded-lg px-2 py-1 blur-background"
              />
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="time"
                id="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="border rounded-lg px-2 py-1 blur-background"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto h-full">
          {selectedTrip ? (
            <div className="p-4">
              <div className="max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                <div className="bg-sky-200 p-2">
                  <button
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                    onClick={() => { setSelectedTrip(null); onTrainSelect(null); }}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">Back</span>
                  </button>
                  </div>

                <div className="bg-white p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium">
                        {formatTime(nextTrains.find(train => train.tripId === selectedTrip)?.departureTime || '')} - {formatTime(nextTrains.find(train => train.tripId === selectedTrip)?.destinationTime || '')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Timer className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium">

                      {calculateDuration(
                        nextTrains.find(train => train.tripId === selectedTrip)?.departureTime || '',
                        nextTrains.find(train => train.tripId === selectedTrip)?.destinationTime || ''
                      )}
                    </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium">
                        Fare ₹ {calculateFare(fromStation, toStation)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Train className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium">Stations {getIntermediateStops(selectedTrip).length}</span>
                    </div>
                    
                  </div>
                  <div className="flex justify-start items-center space-x-2">
                  <SignpostBig className="w-5 h-5 text-gray-600" /> <span className="text-sm font-medium">Towards {nextTrains.find(train => train.tripId === selectedTrip)?.direction}</span>
                  </div>

                  <div className="relative" style={{ height: '400px', overflowY: 'auto' }}>
                    <div className="absolute left-[13px] top-8 bottom-8" style={{height: `${getIntermediateStops(selectedTrip).length * 60 -60}px`, width: '6px', backgroundColor: '#d1e61e' }} />
                    {getIntermediateStops(selectedTrip).map((stop, idx) => (
                      <div key={idx} className="flex items-center p-1 relative">
                        <div className="flex flex-col items-center justify-center mr-4 z-10">
                          <div
                            className="w-6 h-6 flex items-center justify-center"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: idx === 0 ? '#32cd32' : idx === getIntermediateStops(selectedTrip).length - 1 ? '#4965e2' : '#ffffff',
                                margin: 'auto',
                                border: `2px solid ${idx === 0 ? '#d1e61e' : idx === getIntermediateStops(selectedTrip).length - 1 ? '#d1e61e' : '#000000'}`,
                              }}
                            />
                          </div>
                          {idx < getIntermediateStops(selectedTrip).length - 1 && (
                            <div className="h-full w-0.5 mt-1" style={{ backgroundColor: '#DC2626' }} />
                          )}
                        </div>
                        <div className="flex-grow pt-1 flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-lg">{stop.stopName}</h3>
                            <p className="text-sm text-gray-600">{formatTime(stop.arrivalTime)}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Hourglass className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600">{stop.waitingTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            nextTrains.length === 0 ? (
              <div className="text-center py-4 text-gray-600">
                No more trains running on {formatDate(selectedDate)} after {selectedTime}.
              </div>
            ) : (
              <div className="">
                {nextTrains.map((train, index) => (
                  <div key={index} onClick={() => { setSelectedTrip(train.tripId); onTrainSelect(train.tripId); }} className="bg-white  shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Train className="h-8 w-8 text-gray-800" />
                        <div>
                          <p className="font-semibold text-gray-800">{formatTime(train.departureTime)} - {formatTime(train.destinationTime)}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>{calculateDuration(train.departureTime, train.destinationTime)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <span className="text-sm font-medium">₹ {calculateFare(fromStation, toStation)}</span>
                        </div>
                        <button
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label={`Select train trip ${train.tripId}`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTable;
