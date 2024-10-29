import React from 'react';
import { Train, MapPin, Clock, IndianRupee, Phone, Mail, Calendar } from 'lucide-react';
import FareCalculator from './components/FareCalculator';
import StationList from './components/StationList';
import Footer from './components/Footer';
import TimeTableMapLayout from './components/TimeTableMapLayout';
import { DataProvider } from './context/DataContext'; // Import DataProvider

function App() {
  const [selectedStations, setSelectedStations] = React.useState({
    from: 'ALVA',
    to: 'EDAP'
  });

  return (
    <DataProvider> {/* Wrap components with DataProvider */}
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
        
        <section className="relative min-h-[50vh] bg-cover bg-center" style={{
          backgroundImage: 'url("/bg.webp")',
        }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative container mx-auto px-4 py-8 h-full flex flex-col items-center justify-center">
            <div className="text-white text-center max-w-2xl mb-8">
              <h1 className="text-5xl font-bold mb-4">Kochi Metro Timings</h1>
              <p className="text-xl">Explore Kochi Metro: Schedules, Routes, Maps and More!</p>
            </div>
            
            <div className="w-full max-w-3xl bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20">
              <FareCalculator onStationSelect={setSelectedStations} />
            </div>
          </div>
        </section>

        <section id="timetable-map" className="py-8 bg-blue-50">
          <div className="container mx-auto px-4">
            <TimeTableMapLayout fromStation={selectedStations.from} toStation={selectedStations.to} />
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <QuickInfoCard
                icon={<Clock />}
                title="Operating Hours"
                description="6:00 AM - 10:30 PM"
              />
              <QuickInfoCard
                icon={<Train />}
                title="Frequency"
                description="Every 10 minutes during peak hours"
              />
              <QuickInfoCard
                icon={<IndianRupee />}
                title="Fare Range"
                description="₹10 - ₹60"
              />
            </div>
          </div>
        </section>

        <section id="stations" className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <StationList />
          </div>
        </section>

        <Footer />
      </div>
    </DataProvider>
  );
}

function QuickInfoCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-xl bg-blue-50 flex items-start gap-4">
      <div className="text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default App;
