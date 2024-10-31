import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngTuple, PointTuple, divIcon } from 'leaflet';
import { Radio } from "lucide-react"; 
import { useDataContext } from '../context/DataContext';
import { Clock } from './Clock'; 

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


const parseTime = (timeStr: string) => {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const findNearestShapePoint = (
  shapePoints: { coordinates: { lat: number; lon: number }, shape_dist_traveled: number }[],
  station: Station
): number => {
  let minDistance = Infinity;
  let nearestIndex = -1;

  shapePoints.forEach((point, index) => {
    const d = Math.sqrt(
      Math.pow(point.coordinates.lat - station.stop_lat, 2) + 
      Math.pow(point.coordinates.lon - station.stop_lon, 2)
    );
    if (d < minDistance) {
      minDistance = d;
      nearestIndex = index;
    }
  });

  return nearestIndex;
};

const findPositionAlongShape = (
  shapePoints: [number, number][],
  shapesData: { points: { coordinates: { lat: number; lon: number }, shape_dist_traveled: number }[] },
  station1: Station,
  station2: Station,
  progress: number
): LatLngTuple => {
  const idx1 = findNearestShapePoint(shapesData.points, station1);
  const idx2 = findNearestShapePoint(shapesData.points, station2);

  if (idx1 === -1 || idx2 === -1) {
    return [
      station1.stop_lat + progress * (station2.stop_lat - station1.stop_lat),
      station1.stop_lon + progress * (station2.stop_lon - station1.stop_lon)
    ];
  }

  const dist1 = shapesData.points[idx1].shape_dist_traveled;
  const dist2 = shapesData.points[idx2].shape_dist_traveled;
  const targetDist = dist1 + progress * (dist2 - dist1);

  let beforeIdx = idx1;
  let afterIdx = idx1 + 1;
  while (afterIdx < shapesData.points.length && 
         shapesData.points[afterIdx].shape_dist_traveled < targetDist) {
    beforeIdx = afterIdx;
    afterIdx++;
  }

  if (afterIdx >= shapesData.points.length) {
    return [
      shapesData.points[beforeIdx].coordinates.lat,
      shapesData.points[beforeIdx].coordinates.lon
    ];
  }

  const beforePoint = shapesData.points[beforeIdx];
  const afterPoint = shapesData.points[afterIdx];
  const segmentProgress = (targetDist - beforePoint.shape_dist_traveled) / 
                         (afterPoint.shape_dist_traveled - beforePoint.shape_dist_traveled);

  return [
    beforePoint.coordinates.lat + segmentProgress * (afterPoint.coordinates.lat - beforePoint.coordinates.lat),
    beforePoint.coordinates.lon + segmentProgress * (afterPoint.coordinates.lon - beforePoint.coordinates.lon)
  ];
};

const getShapeId = (tripId: string, trips: any[]): string | undefined => {
  const trip = trips.find((t: { trip_id: string; direction_id: number }) => t.trip_id === tripId);
  return trip?.shape_id;
};

const PanesSetup = () => {
  const map = useMap();
  useEffect(() => {
    map.createPane('basePolylines');
    const basePolylinesPane = map.getPane('basePolylines');
    if (basePolylinesPane) {
      basePolylinesPane.style.zIndex = '400';
    }
    map.createPane('selectedRoute');
    const selectedRoutePane = map.getPane('selectedRoute');
    if (selectedRoutePane) {
      selectedRoutePane.style.zIndex = '450';
    }
  }, [map]);
  return null;
};

const MetroMap: React.FC<MetroMapProps> = ({ selectedStations, selectedTrainId }) => {
  const { stopsData, shapesData, stopTimesData, tripsData } = useDataContext();

  const stations = useMemo(() => (stopsData ? stopsData.stops : []), [stopsData]);

  const shapeCoordinates = useMemo(() => {
    if (shapesData) {
      const coordinates: { [key: string]: [number, number][] } = {};
      shapesData.shapes.forEach((shape: any) => {
        coordinates[shape.shape_id] = shape.points.map((point: ShapePoint) => [
          point.coordinates.lat,
          point.coordinates.lon,
        ]);
      });
      return coordinates;
    }
    return {};
  }, [shapesData]);

  const stopTimes = useMemo(() => (stopTimesData ? stopTimesData.trips : []), [stopTimesData]);

  const trips = useMemo(() => (tripsData ? tripsData.trips : []), [tripsData]);

  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [trainPositions, setTrainPositions] = useState<TrainPosition[]>([]);
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null); 

  useEffect(() => {
    if (stations.length === 0 || stopTimes.length === 0 || !shapeCoordinates || trips.length === 0) return;

    const updateTrainPositions = () => {
      const now = new Date();
      const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const currentDay = now.getDay();

      const filteredTrips = stopTimes.filter((trip: any) => {
        if (trip.trip.id.startsWith('WK') && currentDay === 0) return false;
        if (trip.trip.id.startsWith('WE') && currentDay !== 0) return false;
        return true;
      });

      const activeTrainPositions: TrainPosition[] = [];

      for (const trip of filteredTrips) {
        const shapeId = getShapeId(trip.trip.id, trips);
        if (!shapeId || !shapeCoordinates[shapeId]) continue;

        for (let i = 0; i < trip.trip.stops.length - 1; i++) {
          const [stopId1, arrival1, departure1] = trip.trip.stops[i];
          const [stopId2, arrival2] = trip.trip.stops[i + 1];

          const arrivalTime1 = parseTime(arrival1);
          const departureTime1 = parseTime(departure1);
          const arrivalTime2 = parseTime(arrival2);

          const station1 = stations.find((station: Station) => station.stop_id === stopId1);
          const station2 = stations.find((station: Station) => station.stop_id === stopId2);

          if (!station1 || !station2) continue;

          let position: LatLngTuple | undefined;
          let status: string;

          if (currentTime >= arrivalTime1 && currentTime < departureTime1) {
            position = [station1.stop_lat, station1.stop_lon];
            status = "Arrived";
            activeTrainPositions.push({ position, tripId: trip.trip.id, status });
          } else if (currentTime >= departureTime1 && currentTime <= arrivalTime2) {
            const progress = (currentTime - departureTime1) / (arrivalTime2 - departureTime1);
            
            const [lat, lon] = findPositionAlongShape(
              shapeCoordinates[shapeId],
              shapesData.shapes.find((shape: { shape_id: string }) => shape.shape_id === shapeId),
              station1,
              station2,
              progress
            );
            
            if (typeof lat === 'number' && typeof lon === 'number') {
              position = [lat, lon];
              status = "In Transit";
              activeTrainPositions.push({ position, tripId: trip.trip.id, status });
            }
          }
        }
      }
      setTrainPositions(activeTrainPositions);
    };

    const intervalId = setInterval(updateTrainPositions, 1000);
    updateTrainPositions();

    return () => clearInterval(intervalId);
  }, [stations, stopTimes, shapeCoordinates, trips]);

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
    const trip = trips.find((t: { trip_id: string; direction_id: number }) => t.trip_id === tripId);
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
    if (!selectedStations || !shapesData?.shapes[0]) return [];
    const fromStation = stations.find((station: Station) => station.stop_id === selectedStations.from);
    const toStation = stations.find((station: Station) => station.stop_id === selectedStations.to);
    
    if (fromStation && toStation) {
      const shape = shapesData.shapes[0];
      const idx1 = findNearestShapePoint(shape.points, fromStation);
      const idx2 = findNearestShapePoint(shape.points, toStation);
      
      if (idx1 !== -1 && idx2 !== -1) {
        const startIdx = Math.min(idx1, idx2);
        const endIdx = Math.max(idx1, idx2);
        return shape.points.slice(startIdx, endIdx + 1).map((p: { coordinates: { lat: number; lon: number } }) => [p.coordinates.lat, p.coordinates.lon]);
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
          <PanesSetup />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          {Object.entries(shapeCoordinates).map(([shapeId, coordinates]) => (
  <Polyline
    key={shapeId}
    positions={coordinates}
    color={shapeId === 'R1_0' ? '#24b49c' : '#24b49c'} 
    weight={5}
    pane="basePolylines"
  />
  
))}
<Polyline
  positions={getSelectedStationCoordinates()}
  color="#d1e61e" 
  weight={5}
  pane="selectedRoute"
/>


          {stations.map((station: Station) => {
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
