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

      processVoiceCommand(transcript, {
        bullet: bulletRef.current,
        inputValues: inputValuesRef.current,
        conditions: conditionsRef.current,
        allBullets: allBulletsRef.current
      });
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
          try {
            recognizer.start();
          } catch (err) {
            console.warn('Ошибка перезапуска микрофона:', err.message);
          }
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
  }, []);

  const processVoiceCommand = (text, { bullet = null, inputValues = {}, conditions = {}, allBullets = [] } = {}) => {
    let triggerCalculation = false;

    if (text.includes('помощь')) {
      setHelpActive(true);
      setStatus('Доступные голосовые команды:');
      return;
    }

    if (helpActive) {
      setHelpActive(false);
    }

    if (text.includes('расчитай') || text.includes('расчет') || text.includes('расчитать')) {
      triggerCalculation = true;
    }

    if (text.includes('калибр')) {
      const match = text.match(/калибр\s(\d+(\.\d+)?)/);
      if (match) {
        const caliber = parseFloat(match[1]);
        const foundBullet = allBullets.find(b => parseFloat(b.caliber) === caliber);
        if (foundBullet) {
          setBullet(foundBullet);
          setStatus(`Выбран калибр: ${caliber} мм`);
        }
      }
    }

    if (text.includes('пуля') || text.includes('патрон')) {
      const match = text.match(/(?:пуля|патрон)\s([\w\d]+)/i);
      if (match) {
        const keyword = match[1].toLowerCase();
        const foundBullet = allBullets.find(b => b.name.toLowerCase().includes(keyword));
        if (foundBullet) {
          setBullet(foundBullet);
          setStatus(`Выбрана пуля: ${foundBullet.caliber} ${foundBullet.name}`);
        }
      }
    }

    if (text.includes('скорость')) {
      const match = text.match(/скорость\s(\d+)/);
      if (match) {
        setInputValues(prev => ({ ...prev, velocity: parseInt(match[1]) }));
        setStatus(`Скорость: ${match[1]} м/с`);
      }
    }

    if (text.includes('ветер')) {
      const match = text.match(/ветер\s(\d+)(?:.*?(\d+))?/);
      if (match) {
        const speed = parseInt(match[1]);
        const angle = parseInt(match[2]) || 90;
        setConditions(prev => ({ ...prev, windSpeed: speed, windAngle: angle }));
        setStatus(`Ветер: ${speed} м/с угол ${angle}°`);
      }
    }

    if (text.includes('пристрелка')) {
      const match = text.match(/пристрелка\s(\d+)/);
      if (match) {
        setInputValues(prev => ({ ...prev, zeroRange: parseInt(match[1]) }));
        setStatus(`Пристрелка: ${match[1]} м`);
      }
    }

    if (text.includes('температура')) {
      const match = text.match(/температура\s(-?\d+)/);
      if (match) {
        setConditions(prev => ({ ...prev, temperature: parseInt(match[1]) }));
        setStatus(`Температура: ${match[1]}°C`);
      }
    }

    if (text.includes('давление')) {
      const match = text.match(/давление\s(\d+)/);
      if (match) {
        setConditions(prev => ({ ...prev, pressure: parseInt(match[1]) }));
        setStatus(`Давление: ${match[1]} мм рт.ст.`);
      }
    }

    if (text.includes('максимальная') || text.includes('дистанция')) {
      const match = text.match(/(?:максимальная\s)?дистанция\s(\d+)/);
      if (match) {
        setInputValues(prev => ({ ...prev, maxRange: parseInt(match[1]) }));
        setStatus(`Максимальная дистанция: ${match[1]} м`);
      }
    }

    if (text.includes('шаг')) {
      const match = text.match(/шаг\s(\d+)/);
      if (match) {
        setInputValues(prev => ({ ...prev, step: parseInt(match[1]) }));
        setStatus(`Шаг: ${match[1]} м`);
      }
    }

    if (text.includes('прицел') || text.includes('высота')) {
      const match = text.match(/(?:прицел|высота)\s(\d+)/);
      if (match) {
        setInputValues(prev => ({ ...prev, scopeHeight: parseInt(match[1]) }));
        setStatus(`Высота прицела: ${match[1]} мм`);
      }
    }

    if (text.includes('сброс')) {
      setBullet(null);
      setInputValues({
        velocity: '',
        zeroRange: 100,
        scopeHeight: 40,
        maxRange: 1000,
        step: 50,
      });
      setConditions({
        temperature: 15,
        pressure: 760,
        humidity: 50,
        windSpeed: 0,
        windAngle: 90,
      });
      setStatus('Параметры сброшены.');
      return;
    }

    if (triggerCalculation) {
      if (bulletRef.current && bulletRef.current.name && inputValuesRef.current.velocity) {
        setShouldCalculate(true);
        setStatus('Рассчитываю траекторию...');
      } else {
        setStatus('Пуля или скорость не выбраны. Проверьте данные.');
      }
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
    <div className="voice-control">
      <button
        onClick={toggleListening}
        disabled={!browserSupport}
        className={`voice-button ${isListening ? 'listening' : ''}`}
      >
        {isListening ? (<><FaMicrophoneSlash /> Остановить</>) : (<><FaMicrophone /> Голосовое управление</>)}
        {!browserSupport && <FaExclamationTriangle className="warning-icon" />}
      </button>

      <div className={`voice-status ${status.includes('Ошибка') ? 'error' : ''}`} style={{ whiteSpace: 'pre-line' }}>
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
            <li>«Температура 20 градусов»</li>
            <li>«Давление 760 миллиметров»</li>
            <li>«Максимальная дистанция 800»</li>
            <li>«Шаг 50»</li>
            <li>«Высота прицела 40»</li>
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
