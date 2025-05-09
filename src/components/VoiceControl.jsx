import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaExclamationTriangle } from 'react-icons/fa';

const VoiceControl = ({
  bullet,
  inputValues,
  conditions,
  setBullet,
  setInputValues,
  setConditions,
  allBullets = [],
  setShouldCalculate
}) => {
  const [status, setStatus] = useState('Нажмите микрофон для начала');
  const [isListening, setIsListening] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(true);
  const [helpActive, setHelpActive] = useState(false);

  const recognitionRef = useRef(null);
  const bulletRef = useRef(null);
  const inputValuesRef = useRef({});
  const conditionsRef = useRef({});
  const allBulletsRef = useRef([]);

  useEffect(() => { bulletRef.current = bullet; }, [bullet]);
  useEffect(() => { inputValuesRef.current = inputValues; }, [inputValues]);
  useEffect(() => { conditionsRef.current = conditions; }, [conditions]);
  useEffect(() => { allBulletsRef.current = allBullets; }, [allBullets]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupport(false);
      setStatus('Ваш браузер не поддерживает голосовой ввод');
      return;
    }

    const recognizer = new SpeechRecognition();
    recognitionRef.current = recognizer;

    recognizer.continuous = true;
    recognizer.interimResults = false;
    recognizer.lang = 'ru-RU';
    recognizer._forceStopped = false;
    recognizer._isActive = false;

    recognizer.onstart = () => {
      recognizer._isActive = true;
      setIsListening(true);
      if (!helpActive) {
        setStatus('Говорите...');
      }
    };

    recognizer.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join(' ')
        .trim()
        .toLowerCase();

      if (!transcript) return;

      if (transcript.includes('стоп')) {
        recognizer._forceStopped = true;
        recognizer.stop();
        setStatus('Остановлено по команде');
        setHelpActive(false);
        return;
      }

      processVoiceCommand(transcript);
    };

    recognizer.onerror = (event) => {
      if (!recognizer._forceStopped) {
        console.error('Speech recognition error:', event.error);
        setStatus(`Ошибка: ${event.error}`);
      }
      setIsListening(false);
    };

    recognizer.onend = () => {
      recognizer._isActive = false;
      if (!recognizer._forceStopped) {
        setTimeout(() => {
          try { recognizer.start(); } catch {}
        }, 300);
      } else {
        setIsListening(false);
        setStatus('Микрофон выключен');
      }
    };

    return () => {
      recognizer._forceStopped = true;
      recognizer.stop();
    };
  }, [helpActive]);

  const processVoiceCommand = (text) => {
    let trigger = false;
    const iv = inputValuesRef.current;
    const c = conditionsRef.current;
    const bullets = allBulletsRef.current;

    if (text.includes('помощь')) {
      setHelpActive(true);
      setStatus('Доступные голосовые команды:');
      return;
    }
    if (helpActive) setHelpActive(false);
    if (text.includes('расчитай')) trigger = true;
    if (text.includes('скорость')) {
      const match = text.match(/скорость\s(\d+)/);
      if (match) {
        setInputValues({ ...iv, velocity: parseInt(match[1]) });
        setStatus(`Скорость: ${match[1]} м/с`);
      }
    }
    if (text.includes('ветер')) {
      const match = text.match(/ветер\s(\d+)(?:.*?(\d+))?/);
      if (match) {
        setConditions({ ...c, windSpeed: parseInt(match[1]), windAngle: parseInt(match[2]) || 90 });
        setStatus(`Ветер: ${match[1]} м/с угол ${match[2] || 90}°`);
      }
    }
    if (text.includes('пристрелка')) {
      const match = text.match(/пристрелка\s(\d+)/);
      if (match) {
        setInputValues({ ...iv, zeroRange: parseInt(match[1]) });
        setStatus(`Пристрелка: ${match[1]} м`);
      }
    }
    if (trigger && bulletRef.current && iv.velocity) {
      setShouldCalculate(true);
      setStatus('Рассчитываю траекторию...');
    }
  };

  const toggleListening = () => {
    if (!browserSupport) return;
    const recognizer = recognitionRef.current;
    if (isListening) {
      recognizer._forceStopped = true;
      recognizer.stop();
    } else {
      recognizer._forceStopped = false;
      if (!recognizer._isActive) recognizer.start();
    }
  };

  return (
    <div className="voice-control card-glass">
      <button
        onClick={toggleListening}
        disabled={!browserSupport}
        className={`btn-glow voice-button ${isListening ? 'listening' : ''}`}
      >
        {isListening ? (<><FaMicrophoneSlash /> Остановить</>) : (<><FaMicrophone /> Голосовое управление</>)}
        {!browserSupport && <FaExclamationTriangle className="warning-icon" />}
      </button>

      <div className={`voice-status ${status.includes('Ошибка') ? 'error' : ''}`}>
        {status}
      </div>

      {helpActive && (
        <div className="voice-help">
          <p>Доступные команды:</p>
          <ul>
            <li>«Калибр 7.62»</li>
            <li>«Пуля FMJ»</li>
            <li>«Скорость 820 м/с»</li>
            <li>«Ветер 5 90»</li>
            <li>«Пристрелка 100 метров»</li>
            <li>«Рассчитай траекторию»</li>
            <li>«Сброс»</li>
            <li>«Стоп»</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VoiceControl;