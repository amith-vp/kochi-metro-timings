import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngTuple, PointTuple, divIcon } from 'leaflet';
import { Radio } from "lucide-react"; 
import { useDataContext } from '../context/DataContext';
import { Clock } from './Clock'; // Import the Clock component

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MetroMapProps {
  selectedStations?: {
    from: string;
    to: string;
  };
  selectedTrainId?: string | null; 
}

interface Station {
  stop_id: string;
  stop_lat: number;
  stop_lon: number;
  stop_name: string;
  isMain: boolean;
}

interface ShapePoint {
  coordinates: {
    lat: number;
    lon: number;
  };
}

interface TrainPosition {
  position: LatLngTuple;
  tripId: string;
  status: string;
}

const MetroMap: React.FC<MetroMapProps> = ({ selectedStations, selectedTrainId }) => {
  const { stopsData, shapesData, stopTimesData, tripsData } = useDataContext();

  const [stations, setStations] = useState<Station[]>([]);
  const [shapeCoordinates, setShapeCoordinates] = useState<[number, number][]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [trainPositions, setTrainPositions] = useState<TrainPosition[]>([]);
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null); 
  const [stopTimes, setStopTimes] = useState<any[]>([]); 
  const [trips, setTrips] = useState<any[]>([]); 

  useEffect(() => {
    if (stopsData) {
      setStations(stopsData.stops);
    }
  }, [stopsData]);

  useEffect(() => {
    if (shapesData) {
      const coordinates = shapesData.shapes[0].points.map((point: ShapePoint) => [
        point.coordinates.lat,
        point.coordinates.lon,
      ]);
      setShapeCoordinates(coordinates);
    }
  }, [shapesData]);

  useEffect(() => {
    if (stopTimesData) {
      setStopTimes(stopTimesData.trips);
    }
  }, [stopTimesData]);

  useEffect(() => {
    if (tripsData) {
      setTrips(tripsData.trips);
    }
  }, [tripsData]);

  useEffect(() => {
    if (stations.length === 0 || stopTimes.length === 0) return;

    const updateTrainPositions = () => {
      const now = new Date();
      const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const currentDay = now.getDay(); 
      const activeTrainPositions: TrainPosition[] = [];

      for (const trip of stopTimes) {
        if (trip.trip.id.startsWith("WK") && currentDay === 0) {
          continue;
        }
        if (trip.trip.id.startsWith("WE") && currentDay !== 0) {
          continue;
        }

        for (let i = 0; i < trip.trip.stops.length - 1; i++) {
          const [stopId1, arrival1, departure1, distance1] = trip.trip.stops[i];
          const [stopId2, arrival2, departure2, distance2] = trip.trip.stops[i + 1];

          const arrivalTime1 = parseTime(arrival1);
          const departureTime1 = parseTime(departure1);
          const arrivalTime2 = parseTime(arrival2);
          const departureTime2 = parseTime(departure2);

          const station1 = stations.find(station => station.stop_id === stopId1);
          const station2 = stations.find(station => station.stop_id === stopId2);

          if (station1 && station2) {
            let lat, lon, status;
            if (currentTime >= arrivalTime1 && currentTime < departureTime1) {
              lat = station1.stop_lat;
              lon = station1.stop_lon;
              status = "Arrived";
            } else if (currentTime >= departureTime1 && currentTime <= arrivalTime2) {
              const progress = (currentTime - departureTime1) / (arrivalTime2 - departureTime1);
              lat = station1.stop_lat + progress * (station2.stop_lat - station1.stop_lat);
              lon = station1.stop_lon + progress * (station2.stop_lon - station1.stop_lon);
              status = "In Transit";
            } else {
              continue;
            }
            activeTrainPositions.push({ position: [lat, lon], tripId: trip.trip.id, status });
          }
        }
      }
      setTrainPositions(activeTrainPositions);
    };

    const intervalId = setInterval(updateTrainPositions, 1000);
    updateTrainPositions();

    return () => clearInterval(intervalId); 
  }, [stations, stopTimes]);

  const parseTime = (timeStr: string) => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const mapCenter: LatLngTuple = [10.0206, 76.3215];

  const mapBounds: LatLngTuple[] = [
    [9.93, 76.2],
    [10.13, 76.4], 
  ];

  const ZoomHandler = () => {
    const map = useMap();
    useEffect(() => {
      const onZoom = () => {
        setZoomLevel(map.getZoom());
      };
      map.on('zoomend', onZoom);
      return () => {
        map.off('zoomend', onZoom);
      };
    }, [map]);
    return null;
  };

  const directionColors: { [key: number]: string } = {
    0: '#2563eb', 
    1: '#F44336', 
  };

  const getTrainColor = (tripId: string) => {
    if (tripId === selectedTrainId) {
      return '#32cd32'; 
    }
    const trip = trips.find(t => t.trip_id === tripId);
    return trip ? directionColors[trip.direction_id] : '#4CAF50'; 
  };

  const stationIcon = divIcon({
    html: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
             <circle cx="8" cy="8" r="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.7"/>
           </svg>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  const selectedStationIcon = (isDeparture: boolean) => divIcon({
    html: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
             <circle cx="10" cy="10" r="5" fill="${isDeparture ? '#32cd32' : '#4965e2'}" stroke="#d1e61e" stroke-width="2"/>
           </svg>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const getSelectedStationCoordinates = () => {
    if (!selectedStations) return [];
    const fromStation = stations.find(station => station.stop_id === selectedStations.from);
    const toStation = stations.find(station => station.stop_id === selectedStations.to);
    if (fromStation && toStation) {
      const tolerance = 0.001;
      const fromIndex = shapeCoordinates.findIndex(coord => 
        Math.abs(coord[0] - fromStation.stop_lat) < tolerance && 
        Math.abs(coord[1] - fromStation.stop_lon) < tolerance
      );
      const toIndex = shapeCoordinates.findIndex(coord => 
        Math.abs(coord[0] - toStation.stop_lat) < tolerance && 
        Math.abs(coord[1] - toStation.stop_lon) < tolerance
      );
      if (fromIndex !== -1 && toIndex !== -1) {
        return fromIndex < toIndex
          ? shapeCoordinates.slice(fromIndex, toIndex + 1)
          : shapeCoordinates.slice(toIndex, fromIndex + 1).reverse();
      }
    }
    return [];
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Radio className="w-6 h-6" />
          Metro Map
        </h2>
        <Clock currentTime={new Date()} /> {/* Render the Clock component */}
      </div>
      <div className="h-[600px] rounded-lg overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={12} 
          minZoom={12}
          maxBounds={mapBounds} 
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          <Polyline
            positions={shapeCoordinates}
            color="#24b49c" 
            weight={5}
          />

          <Polyline
            positions={getSelectedStationCoordinates()}
            color="#d1e61e" 
            weight={5}
          />

          {stations.map((station) => {
            const isSelected = selectedStations && (station.stop_id === selectedStations.from || station.stop_id === selectedStations.to);
            const isDeparture = selectedStations && station.stop_id === selectedStations.from;
            const direction = station.stop_lon > mapCenter[1] ? 'right' : 'left';
            const offset: PointTuple = direction === 'right' ? [10, 0] : [-10, 0];
            return (
              <Marker
                key={station.stop_id}
                position={[station.stop_lat, station.stop_lon]}
                icon={isSelected ? selectedStationIcon(isDeparture ?? false) : stationIcon}
              >
                {( zoomLevel > 13) && (
                  <Tooltip direction={direction} offset={offset} opacity={1} permanent>
                    <span>{station.stop_name}</span>
                  </Tooltip>
                )}
              </Marker>
            );
          })}

          {trainPositions.map(({ position, tripId, status }, index) => {
            const trainColor = getTrainColor(tripId);
            const trainIcon = divIcon({
              html: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="10" fill="${trainColor}" stroke="${status === "Arrived" ? "#FFD700" : trainColor}" stroke-width="2"/>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tram-front" x="6" y="6">
                <rect width="16" height="16" x="4" y="3" rx="2"/>
                <path d="M4 11h16"/>
                <path d="M12 3v8"/>
                <path d="m8 19-2 3"/>
                <path d="m18 22-2-3"/>
                <path d="M8 15h.01"/>
                <path d="M16 15h.01"/>
              </svg>
            </svg>`,
              className: '',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            return (
              <Marker
                key={index}
                position={position}
                icon={trainIcon}
                eventHandlers={{
                  click: () => {
                    setVisibleTooltip(visibleTooltip === tripId ? null : tripId);
                  },
                }}
              >
                {visibleTooltip === tripId && (
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <span>Train ID: {tripId} - {status}</span>
                  </Tooltip>
                )}
              </Marker>
            );
          })}

          <ZoomHandler />
        </MapContainer>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Train locations are based on schedules and are not live.
      </div>

      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#2563eb]"></div>
          <span className="text-sm text-gray-600">Towards Thrippunithura</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#F44336]"></div>
          <span className="text-sm text-gray-600">Towards Aluva</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-[#FFD700] bg-transparent"></div>
          <span className="text-sm text-gray-600">At Station</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#32cd32]"></div>
          <span className="text-sm text-gray-600">Selected Train</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2  bg-[#d1e61e]"></div>
          <span className="text-sm text-gray-600">Selected Route</span>
        </div>
      </div>
    </div>
  );
};

export default MetroMap;
