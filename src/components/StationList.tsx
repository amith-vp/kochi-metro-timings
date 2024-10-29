'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Train, Info, Clock, Users, CreditCard, ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useDataContext } from '../context/DataContext'

const stationCodeMap: { [key: string]: string } = {
  "Aluva": "ALVA",
  "Pulinchodu": "PNCU",
  "Companypady": "CPPY",
  "Ambattukavu": "ATTK",
  "Muttom": "MUTT",
  "Kalamassery": "KLMT",
  "Cochin University": "CCUV",
  "Pathadipalam": "PDPM",
  "Edapally": "EDAP",
  "Changampuzha Park": "CGPP",
  "Palarivattom": "PARV",
  "JL N Stadium": "JLSD",
  "Kaloor": "KALR",
  "Town Hall": "TNHL",
  "M.G Road": "MGRD",
  "Maharajas College": "MACE",
  "Ernakulam South": "ERSH",
  "Kadavanthra": "KVTR",
  "Elamkulam": "EMKM",
  "Vyttila": "VYTA",
  "Thaikoodam": "THYK",
  "Pettah": "PETT",
  "Vadakkekotta": "VAKK",
  "SN Junction": "SNJN",
  "Thrippunithura": "TPHT"
};

const trackPathForward = "M 1250 10 H 625 C 604 11 604 11 550 35 C 502 59 502 60 475 60 L 120 60 C 100 60 100 80 100 100 L 100 180 C 101 228 85 219 225 220 L 620 220 C 667 221 660 223 700 260 C 765 333 754 317 765 320 L 950 320";
const trackPathBackward = "M 950 310 L 765 310 C 754 307 765 323 700 250 C 660 213 667 211 620 210 L 225 210 C 105 209 111 218 110 190 L 110 110 C 110 90 110 70 120 70 L 475 70 C 502 70 502 69 550 45 C 604 21 604 21 625 20 H 1250";

interface Station {
  id: number;
  x: number;
  y: number;
  name: string;
  rotation: number;
  customPosition: {
    x: number;
    y: number;
  };
  translations: { field_name: string; translation: string }[];
  wheelchairBoarding: number;
}

const stations: Station[] = [
  { id: 1, x: 1250, y: 15, name: "Aluva", rotation:30, customPosition: { x: 1250, y: 42 }, translations: [], wheelchairBoarding: 0 },
  { id: 2, x: 1190, y: 15, name: "Pulinchodu", rotation:30, customPosition: { x: 1205, y: 50 }, translations: [], wheelchairBoarding: 0 },
  { id: 3, x: 1130, y: 15, name: "Companypady", rotation:30, customPosition: { x: 1150, y: 55 }, translations: [], wheelchairBoarding: 0 },
  { id: 4, x: 1065, y: 15, name: "Ambattukavu", rotation:30, customPosition: { x: 1085, y: 52 }, translations: [], wheelchairBoarding: 0 },
  { id: 5, x: 990, y: 15, name: "Muttom", rotation:30, customPosition: { x: 1000, y: 45 }, translations: [], wheelchairBoarding: 0 },
  { id: 6, x: 920, y: 15, name: "Kalamassery", rotation:30, customPosition: { x: 935, y: 53 }, translations: [], wheelchairBoarding: 0 },
  { id: 7, x: 850, y: 15, name: "Cochin University", rotation:30, customPosition: { x: 875, y: 58 }, translations: [], wheelchairBoarding: 0 },
  { id: 8, x: 765, y: 15, name: "Pathadipalam", rotation:30, customPosition: { x: 785, y: 52 }, translations: [], wheelchairBoarding: 0 },
  { id: 9, x: 635, y: 15, name: "Edapally", rotation:30, customPosition: { x: 644, y: 47 }, translations: [], wheelchairBoarding: 0 },
  { id: 10, x: 550, y: 40, name: "Changampuzha Park", rotation: 30, customPosition: { x: 595, y: 80 }, translations: [], wheelchairBoarding: 0 },
  { id: 11, x: 475, y: 65, name: "Palarivattom", rotation:-30, customPosition: { x: 493, y: 37 }, translations: [], wheelchairBoarding: 0 },
  { id: 12, x: 350, y: 65, name: "JL N Stadium", rotation: -30, customPosition: { x: 367, y: 35 }, translations: [], wheelchairBoarding: 0 },
  { id: 13, x: 235, y: 65, name: "Kaloor", rotation: -30, customPosition: { x: 240, y: 43 }, translations: [], wheelchairBoarding: 0 },
  { id: 14, x: 120, y: 65, name: "Town Hall", rotation: -30, customPosition: { x: 140, y: 40 }, translations: [], wheelchairBoarding: 0 },
  { id: 15, x: 105, y: 109, name: "M.G Road", rotation: 0, customPosition: { x: 140, y: 115 }, translations: [], wheelchairBoarding: 0 },
  { id: 16, x: 105, y: 148, name: "Maharajas College", rotation: 0, customPosition: { x: 160, y: 150 }, translations: [], wheelchairBoarding: 0 },
  { id: 17, x: 105, y: 184, name: "Ernakulam South", rotation: 0, customPosition: { x: 158, y: 184 }, translations: [], wheelchairBoarding: 0 },
  { id: 18, x: 235, y: 215, name: "Kadavanthra", rotation:30, customPosition: { x: 250, y: 250 }, translations: [], wheelchairBoarding: 0 },
  { id: 19, x: 475, y: 215, name: "Elamkulam", rotation:30, customPosition: { x: 490, y: 250 }, translations: [], wheelchairBoarding: 0 },
  { id: 20, x: 635, y: 215, name: "Vyttila", rotation:30, customPosition: { x: 635, y: 245 }, translations: [], wheelchairBoarding: 0 },
  { id: 21, x: 700, y: 255, name: "Thaikoodam", rotation: 0, customPosition: { x: 740, y: 258 }, translations: [], wheelchairBoarding: 0 },
  { id: 22, x: 765, y: 315, name: "Pettah", rotation:30, customPosition: { x: 770, y: 342 }, translations: [], wheelchairBoarding: 0 },
  { id: 23, x: 850, y: 315, name: "Vadakkekotta", rotation:30, customPosition: { x: 868, y: 353 }, translations: [], wheelchairBoarding: 0 },
  { id: 24, x: 913, y: 315, name: "SN Junction", rotation:30, customPosition: { x: 928, y: 352 }, translations: [], wheelchairBoarding: 0 },
  { id: 25, x: 950, y: 315, name: "Thrippunithura", rotation:30, customPosition: { x: 968, y: 357 }, translations: [], wheelchairBoarding: 0 },
]

export default function MetroMapWithLegend() {
  const { stopsData, stopTimesData, tripsData, calendarData } = useDataContext();

  const [selectedStation, setSelectedStation] = useState<Station | null>(stations.find(station => station.name === "Edapally") || null)
  const [trainPosition, setTrainPosition] = useState(0)
  const [isForward, setIsForward] = useState(true)
  const [isInfoExpanded, setIsInfoExpanded] = useState(false)
  const [nextTrains, setNextTrains] = useState<{ aluva: string[], thrippunithura: string[] }>({ aluva: [], thrippunithura: [] });
  const [isAnimationTriggered, setIsAnimationTriggered] = useState(false);
  const metroMapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (stopsData) {
      stations.forEach((station, index) => {
        station.translations = stopsData.stops[index]?.translations || [];
        station.wheelchairBoarding = stopsData.stops[index]?.wheelchair_boarding || 0;
      });
    }
  }, [stopsData]);

  useEffect(() => {
    const handleScroll = () => {
      if (metroMapRef.current) {
        const rect = metroMapRef.current.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          setIsAnimationTriggered(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrainPosition((prev) => {
        if (prev >= 1) {
          setIsForward(false)
          return 0.99
        }
        if (prev <= 0) {
          setIsForward(true)
          return 0.01
        }
        return isForward ? prev + 0.01 : prev - 0.01
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isForward])

  useEffect(() => {
    if (!selectedStation || !stopTimesData || !tripsData || !calendarData) return;

    const getNextTrains = () => {
      const currentTime = new Date();
      const currentHours = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();
      const currentDay = currentTime.toLocaleString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof calendarData.service_calendar[0]['days'];
      const stationCode = stationCodeMap[selectedStation.name as keyof typeof stationCodeMap];

      const trains = stopTimesData.trips.flatMap((trip: any) => {
        const fromIndex = trip.trip.stops.findIndex((stop: any) => stop[0] === stationCode);
        if (fromIndex === -1) return [];

        const departureTime = trip.trip.stops[fromIndex][2].toString();
        const [hours, minutes] = departureTime.split(':').map(Number);

        if (hours < currentHours || (hours === currentHours && minutes <= currentMinutes)) return [];

        const tripData = tripsData.trips.find((t: any) => t.trip_id === trip.trip.id);
        const direction = tripData?.direction_id === 0 ? 'Thrippunithura' : 'Aluva';

        const serviceId = tripData?.service_id;
        const isServiceActive = calendarData.service_calendar.some((service: any) => 
          service.service_id === serviceId && service.days[currentDay]
        );

        if (!isServiceActive) return [];

        const date = new Date();
        date.setHours(hours, minutes);
        const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

        return [{
          departureTime: formattedTime,
          direction
        }];
      });

      const sortedTrains = trains.sort((a: any, b: any) => {
        const [aHours, aMinutes] = a.departureTime.split(':').map(Number);
        const [bHours, bMinutes] = b.departureTime.split(':').map(Number);
        return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
      });

      const aluvaTrains = sortedTrains.filter((train: any) => train.direction === 'Aluva').map((train: any) => train.departureTime).slice(0, 3);
      const thrippunithuraTrains = sortedTrains.filter((train: any) => train.direction === 'Thrippunithura').map((train: any) => train.departureTime).slice(0, 3);

      return { aluva: aluvaTrains, thrippunithura: thrippunithuraTrains };
    };

    setNextTrains(getNextTrains());
  }, [selectedStation, stopTimesData, tripsData, calendarData]);

  const handleStationClick = (station: Station): void => {
    setSelectedStation(station)
    setIsInfoExpanded(true)
  }

  return (
    <div className="relative w-full max-w mx-auto bg-gray-100 p-4 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">Kochi Metro Route Map</h1>
      <AnimatePresence>
        {selectedStation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isInfoExpanded ? 'auto' : 0, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white mt-4 rounded-lg shadow-md overflow-hidden"
          >
            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedStation.name}</h2>
                    <p className="text-xs text-gray-500">
                      {selectedStation.translations.map((translation) => translation.translation).join(' / ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-600">ID: {selectedStation.id}</span>
                    <div className="text-xs text-green-600 flex items-center justify-end mt-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedStation.wheelchairBoarding ? 'Wheelchair Accessible' : 'Not Wheelchair Accessible'}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-600 mb-1">Towards Aluva</h3>
                    <ul className="space-y-1">
                      {nextTrains.aluva.length > 0 ? nextTrains.aluva.map((time, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <Clock className="w-3 h-3 mr-1 text-blue-400" />
                          <span className="font-medium">{time}</span>
                        </li>
                      )) : <li>No upcoming trains</li>}
                    </ul>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-purple-600 mb-1">Towards Thrippunithura</h3>
                    <ul className="space-y-1">
                      {nextTrains.thrippunithura.length > 0 ? nextTrains.thrippunithura.map((time, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <Clock className="w-3 h-3 mr-1 text-purple-400" />
                          <span className="font-medium">{time}</span>
                        </li>
                      )) : <li>No upcoming trains</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative" ref={metroMapRef}>
        <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
          <svg width="1200" height="400" viewBox="0 0 1300 400" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d={trackPathForward}
              stroke="#4CAF50"
              strokeWidth="8"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={isAnimationTriggered ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.path
              d={trackPathBackward}
              stroke="#F44336"
              strokeWidth="8"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={isAnimationTriggered ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
            />
            {stations.map((station) => (
              <g key={station.id}>
                <motion.circle
                  cx={station.x}
                  cy={station.y}
                  r="6"
                  className="fill-white stroke-gray-800 stroke-2 cursor-pointer"
                  initial={{ scale: 0 }}
                  animate={isAnimationTriggered ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.5, delay: station.id * 0.05 }}
                  whileHover={{ scale: 1.5 }}
                  onClick={() => handleStationClick(station)}
                />
                <motion.text
                  x={station.customPosition.x}
                  y={station.customPosition.y}
                  className="text-[10px] font-medium text-center fill-gray-700 pointer-events-none"
                  textAnchor="middle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: station.id * 0.05 }}
                  transform={`rotate(${station.rotation}, ${station.customPosition.x}, ${station.customPosition.y})`}
                >
                  {station.name}
                </motion.text>
              </g>
            ))}
            <motion.g
              initial={{ x: 0, y: 0 }}
              animate={{
                offsetDistance: `${trainPosition * 100}%`,
                rotateY: isForward ? 0 : 180,
              }}
              transition={{ duration: 0.1 }}
              style={{ offsetPath: `path("${isForward ? trackPathForward : trackPathBackward}")` }}
            >
            </motion.g>
          </svg>
        </div>
      </div>
      <div className="mt-4 flex justify-center space-x-8">
        <div className="flex items-center">
          <div className="w-6 h-2 bg-green-500 mr-2"></div>
          <span className="text-sm font-medium flex items-center">
            Northbound <ArrowUp className="w-4 h-4 ml-1" />
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-2 bg-red-500 mr-2"></div>
          <span className="text-sm font-medium flex items-center">
            Southbound <ArrowDown className="w-4 h-4 ml-1" />
          </span>
        </div>
      </div>
    </div>
  )
}
