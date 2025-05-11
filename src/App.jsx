import { useState, useEffect } from 'react';
import BallisticCalculator from './components/BallisticCalculator';
import './App.css';
import './styles/global.css';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import TrajectoryChartPage from './components/TrajectoryChartPage';
import ChartImagePage from './components/ChartImagePage';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BallisticCalculator />} />
        <Route path="/chart" element={<TrajectoryChartPage />} />
        <Route path="/chart-image" element={<ChartImagePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
