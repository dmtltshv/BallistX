import { useState, useEffect } from 'react';
import InputForm from './InputForm';
import ResultsTable from './ResultsTable';
import TrajectoryChart from './TrajectoryChart';
import WeatherIntegration from './WeatherIntegration';
import CorrectionTools from './CorrectionTools';
import BulletLibraryModal from './BulletLibraryModal';
import JournalModal from './JournalModal';
import AIAssistant from './AIAssistant';
import VoiceControl from './VoiceControl';
import ThemeToggle from './ThemeToggle';
import CameraOverlay from './CameraOverlay';
import { FaSun, FaMoon } from 'react-icons/fa';
import { calculateTrajectory } from '../services/ballisticCalculations';
import ballisticData from '../data/ballisticData';
import OfflineManager from '../services/OfflineManager';

const BallisticCalculator = () => {
  const [bullet, setBullet] = useState(null);
  const [inputValues, setInputValues] = useState({
    velocity: '',
    zeroRange: 100,
    scopeHeight: 40,
    maxRange: 1000,
    step: 50,
  });
  const [conditions, setConditions] = useState({
    temperature: 15,
    pressure: 760,
    humidity: 50,
    windSpeed: 0,
    windAngle: 90,
  });
  const [results, setResults] = useState([]);
  const [originalResults, setOriginalResults] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [offlineManager] = useState(new OfflineManager());
  const [isFieldMode, setIsFieldMode] = useState(() => {
    return JSON.parse(localStorage.getItem('ballistic-field-mode')) || false;
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState('light');
  const [customBullets, setCustomBullets] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [shouldCalculate, setShouldCalculate] = useState(false);

  const handleAddCustomBullet = (bullet) => {
    setCustomBullets(prev => [...prev, bullet]);
  };
  

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

  useEffect(() => {
    localStorage.setItem('ballistic-field-mode', JSON.stringify(isFieldMode));
  }, [isFieldMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ballistic-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (shouldCalculate) {
      calculate();
      setShouldCalculate(false);
    }
  }, [shouldCalculate]);

  const calculate = () => {
    if (!bullet || !inputValues.velocity) {
      alert('Выберите пулю и введите скорость');
      return;
    }
    const initialVelocity = parseFloat(inputValues.velocity);
    const maxRange = parseInt(inputValues.maxRange) || 1000;
    let step = parseInt(inputValues.step) || 50;
    step = Math.max(10, Math.min(step, maxRange));

    const calculatedResults = calculateTrajectory({
      bullet,
      initialVelocity,
      zeroRange: inputValues.zeroRange,
      scopeHeight: inputValues.scopeHeight,
      conditions,
      maxRange,
      step,
    });

    setResults(calculatedResults);
    setOriginalResults(calculatedResults);
    saveSession(calculatedResults);
  };

  const saveSession = async (results) => {
    if (!bullet || !results || !Array.isArray(results)) return;
    try {
      const db = await offlineManager.getDB();
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const session = {
        date: new Date().toISOString(),
        bulletId: bullet.id,
        bulletName: `${bullet.caliber} ${bullet.name}`,

        velocity: parseFloat(inputValues.velocity),
        zeroRange: inputValues.zeroRange,
        scopeHeight: inputValues.scopeHeight,
        maxRange: inputValues.maxRange,
        step: inputValues.step,
        conditions: { ...conditions },
        results: [...results]
      };
      await store.add(session);
    } catch (error) {
      console.error('Ошибка при сохранении сессии:', error);
    }
  };

  const loadSessionHandler = (session) => {
    const allBullets = [...ballisticData, ...customBullets];
    const sessionBullet = allBullets.find(b => b.id === session.bulletId);
    if (sessionBullet) {
      setBullet(sessionBullet);
      setInputValues({
        velocity: session.velocity,
        zeroRange: session.zeroRange,
        scopeHeight: session.scopeHeight,
        maxRange: session.maxRange,
        step: session.step
      });
      setConditions(session.conditions);
      setResults(session.results);
      setOriginalResults(session.results);
      setShowJournal(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ballistic-theme', newTheme);
  };
 
  return (
    <div className={`calculator-container \${isFieldMode ? 'field-mode' : ''}`}>
      <div className="app-header">
        <h1 className="section-title" data-icon="🎯">BallistX</h1>
        <div className="app-controls">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button className={`btn-glow mode-switch \${isFieldMode ? 'field' : 'full'}`} onClick={() => setIsFieldMode(!isFieldMode)}>
            {isFieldMode ? (<><FaSun /> Полный режим</>) : (<><FaMoon /> Полевой режим</>)}
          </button>
        </div>
      </div>

      <div className="calculator-content">
        <div className="input-section">
          <InputForm
            bullet={bullet}
            setBullet={setBullet}
            inputValues={inputValues}
            setInputValues={setInputValues}
            conditions={conditions}
            setConditions={setConditions}
            onOpenLibrary={() => setShowLibrary(true)}
            onOpenJournal={() => setShowJournal(true)}
            isFieldMode={isFieldMode}
            onCalculate={calculate}
            windData={conditions}
            customBullets={customBullets}
          />
          {!isFieldMode && (
            <>
              <VoiceControl
                bullet={bullet}
                inputValues={inputValues}
                conditions={conditions}
                setBullet={setBullet}
                setInputValues={setInputValues}
                setConditions={setConditions}
                allBullets={[...ballisticData, ...customBullets]}
                setShouldCalculate={setShouldCalculate}
              />
              <WeatherIntegration
                conditions={conditions}
                setConditions={setConditions}
                disabled={!isOnline}
              />
              <CorrectionTools
                results={results}
                originalResults={originalResults}
                setResults={setResults}
              />
            </>
          )}
        </div>

        <div className="output-section">
          {results.length > 0 && (
            <>
              {!isFieldMode && <TrajectoryChart key={theme} results={results} />}
              <ResultsTable results={results} isFieldMode={isFieldMode} />
            </>
          )}
          <AIAssistant
            results={results}
            bullet={bullet}
            conditions={conditions}
            isFieldMode={isFieldMode}
          />
        </div>
      </div>

      <div className="camera-overlay-trigger">
        <button className="btn-glow" onClick={() => setShowCamera(true)}>Включить камеру</button>
      </div>

      {showCamera && (
        <CameraOverlay results={results} onClose={() => setShowCamera(false)} />
      )}

      {showLibrary && (
        <div className="modal-overlay">
          <BulletLibraryModal
            show={showLibrary}
            onClose={() => setShowLibrary(false)}
            bullets={ballisticData}
            onSelect={setBullet}
            offlineManager={offlineManager}
            onAddCustomBullet={handleAddCustomBullet}
          />
        </div>
      )}

      {showJournal && (
        <div className="modal-overlay">
          <JournalModal
            show={showJournal}
            onClose={() => setShowJournal(false)}
            offlineManager={offlineManager}
            onLoadSession={loadSessionHandler}
          />
        </div>
      )}
    </div>
  );
};

export default BallisticCalculator;