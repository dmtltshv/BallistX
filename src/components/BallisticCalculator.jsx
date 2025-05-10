import { useState, useEffect, useRef } from 'react';
import InputForm from './InputForm';
import ResultsTable from './ResultsTable';
import TrajectoryChart from './TrajectoryChart';
import WeatherIntegration from './WeatherIntegration';
import CorrectionTools from './CorrectionTools';
import BulletLibraryModal from './BulletLibraryModal';
import JournalModal from './JournalModal';
import AIAssistant from './AIAssistant';
import VoiceControl from './VoiceControl';
import CameraOverlay from './CameraOverlay';
import {FiBook, FiClock, FiSettings, FiSun, FiMoon, FiMenu} from 'react-icons/fi';
import { calculateTrajectory } from '../services/ballisticCalculations';
import ballisticData from '../data/ballisticData';
import OfflineManager from '../services/OfflineManager';
import { ReactComponent as BallistXLogo } from '../assets/logo.svg';


<a href="/" className="logo-link">
  <BallistXLogo className="logo-image" />
</a>


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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ballistic-theme') || 'light';
  });  
  const [customBullets, setCustomBullets] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [shouldCalculate, setShouldCalculate] = useState(false);

  const handleAddCustomBullet = (bullet) => {
    setCustomBullets(prev => [...prev, bullet]);
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [closingJournal, setClosingJournal] = useState(false);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  if (menuOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [menuOpen]);

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
    if (shouldCalculate) {
      calculate();
      setShouldCalculate(false);
    }
  }, [shouldCalculate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
  
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);
  
  const handleCloseJournal = () => {
    if (closingJournal) return;
    setClosingJournal(true);
    setTimeout(() => {
      setShowJournal(false);
      setClosingJournal(false);
    }, 300);
  };
  
  useEffect(() => {
    const loadCustomBullets = async () => {
      try {
        const db = await offlineManager.getDB();
        const tx = db.transaction('bullets', 'readonly');
        const store = tx.objectStore('bullets');
        const request = store.getAll();
  
        request.onsuccess = (e) => {
          setCustomBullets(e.target.result || []);
        };
      } catch (error) {
        console.error('Ошибка загрузки пользовательских пуль:', error);
      }
    };
  
    loadCustomBullets();
  }, [offlineManager]);
  
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
    
  const [closingLibrary, setClosingLibrary] = useState(false);

  const handleCloseLibrary = () => {
    setClosingLibrary(true);
    setTimeout(() => {
      setShowLibrary(false);
      setClosingLibrary(false);
    }, 300); // должно совпадать с длительностью анимации
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

 useEffect(() => {
  const saved = localStorage.getItem('ballistic-theme');
  const initialTheme = saved || document.documentElement.getAttribute('data-theme') || 'light';

  setTheme(initialTheme);
  document.documentElement.setAttribute('data-theme', initialTheme);
}, []);

  return (
    <div className={`calculator-container ${isFieldMode ? 'field-mode' : ''} main-layout ${results?.length > 0 ? 'has-results' : 'no-results'}`}>
     <>
    <button
      className="floating-burger"
      onClick={() => {
        setMenuOpen(prev => !prev);
        setShowLibrary(false);
        setShowJournal(false);
      }}
    >
      <FiMenu className="menu-icon" />
    </button>

    {menuOpen && (
      <div className="floating-menu" ref={menuRef}>
        <button onClick={() => { setShowLibrary(true); setMenuOpen(false); }} className="menu-button">
          <FiBook className="menu-icon" /> Пули
        </button>
        <button onClick={() => { setShowJournal(true); setMenuOpen(false); }} className="menu-button">
          <FiClock className="menu-icon" /> История
        </button>
        <button onClick={() => { setIsFieldMode(!isFieldMode)}} className="menu-button">
          <FiSettings className="menu-icon" /> Режим
        </button>
        <button onClick={() => { toggleTheme()}} className="menu-button">
          {theme === 'dark' ? <FiSun className="menu-icon" /> : <FiMoon className="menu-icon" />} Тема
        </button>
      </div>
    )}
    </>
    
      <div className="app-header">
      <h1 className="visually-hidden">BallistX — баллистический калькулятор</h1>
      <div className="logo-wrapper">
        <a href="/">
          <BallistXLogo className="logo-icon" />
        </a>
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
        {results.length > 0 && (
            <>
        <div className="output-section">
              {!isFieldMode && <TrajectoryChart key={theme} results={results} />}
              <ResultsTable results={results} isFieldMode={isFieldMode} onOpenCamera={() => setShowCamera(true)}/>
              {showCamera && (
              <CameraOverlay
                results={results}
                onClose={() => setShowCamera(false)} // 👈 и это тоже
              />
            )}
          {!isFieldMode && (
          <AIAssistant
            results={results}
            bullet={bullet}
            conditions={conditions}
            isFieldMode={false} // можно даже не передавать, но оставим для совместимости
          />
        )}
        </div>
         </>
          )}
      </div>

      {showLibrary && (
  <div className="modal-overlay" onClick={handleCloseLibrary}>
    <div className={`modal-panel ${closingLibrary ? 'slide-out' : ''}`}
      onClick={(e) => e.stopPropagation()}>
        <BulletLibraryModal
  show={showLibrary}
  onClose={handleCloseLibrary}
          bullets={ballisticData}
          onSelect={setBullet}
          offlineManager={offlineManager}
          onAddCustomBullet={handleAddCustomBullet}
        />
      </div>
    </div>
)}


{showJournal && (
  <div className="modal-overlay" onClick={handleCloseJournal}>
    <div
      className={`modal-panel ${closingJournal ? 'slide-out' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <JournalModal
        show={showJournal}
        onClose={handleCloseJournal}
        offlineManager={offlineManager}
        onLoadSession={loadSessionHandler}
      />
      </div>
        </div>
      )}
    </div>
  );
};

export default BallisticCalculator;