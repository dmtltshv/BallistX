import { useState, useEffect } from 'react';
import BallisticCalculator from './components/BallisticCalculator';
import './App.css';
import './styles/global.css';

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
    <div className="app">
      <BallisticCalculator />
      <footer className="footer">
        <p>© {new Date().getFullYear()} Dmitrii Latyshev — <a href="https://github.com/dmtltshv" target="_blank" rel="noopener noreferrer">@dmtltshv</a></p>
      </footer>
    </div>
  );
}

export default App;