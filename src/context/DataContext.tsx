import React, { createContext, useContext, useState, useEffect } from 'react';

interface DataContextType {
  stopsData: any;
  shapesData: any;
  stopTimesData: any;
  tripsData: any;
  calendarData: any;
  fareData: any;
  error: Error | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stopsData, setStopsData] = useState<any>(null);
  const [shapesData, setShapesData] = useState<any>(null);
  const [stopTimesData, setStopTimesData] = useState<any>(null);
  const [tripsData, setTripsData] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [fareData, setFareData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stopsResponse = await fetch('/data/stops.json');
        const shapesResponse = await fetch('/data/shapes.json');
        const stopTimesResponse = await fetch('/data/stop_times.json');
        const tripsResponse = await fetch('/data/trips.json');
        const calendarResponse = await fetch('/data/calendar.json');
        const fareResponse = await fetch('/data/fare.json');

        if (!stopsResponse.ok || !shapesResponse.ok || !stopTimesResponse.ok || !tripsResponse.ok || !calendarResponse.ok || !fareResponse.ok) {
          throw new Error('Network response was not ok');
        }

        setStopsData(await stopsResponse.json());
        setShapesData(await shapesResponse.json());
        setStopTimesData(await stopTimesResponse.json());
        setTripsData(await tripsResponse.json());
        setCalendarData(await calendarResponse.json());
        setFareData(await fareResponse.json());
      } catch (err) {
        setError(err as Error);
      }
    };

    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ stopsData, shapesData, stopTimesData, tripsData, calendarData, fareData, error }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
