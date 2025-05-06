import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaExclamationTriangle } from 'react-icons/fa';

const VoiceControl = ({
  setBullet,
  setInputValues,
  setConditions,
  onCalculate,
  allBullets = []
}) => {
  const [status, setStatus] = useState('Нажмите микрофон для начала');
  const [isListening, setIsListening] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const initSpeechRecognition = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setBrowserSupport(false);
        setStatus('Ваш браузер не поддерживает голосовой ввод');
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      const recognizer = recognitionRef.current;

      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'ru-RU';

      recognizer.onstart = () => {
        setIsListening(true);
        setStatus('Говорите команду...');
      };

      recognizer.onend = () => {
        setIsListening(false);
        setStatus('Микрофон отключен');
      };

      recognizer.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join(' ')
          .trim();

        if (transcript) {
          console.log('Распознано:', transcript);
          processVoiceCommand(transcript);
        }
      };

      recognizer.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        if (event.error === 'network') {
          setStatus('Ошибка сети. Проверьте подключение к интернету');
          setTimeout(() => setStatus('Нажмите микрофон для начала'), 3000);
          return;
        }

        const errorMessages = {
          'no-speech': 'Речь не обнаружена',
          'audio-capture': 'Не удалось захватить аудио',
          'not-allowed': 'Доступ к микрофону запрещен',
          'language-not-supported': 'Русский язык не поддерживается',
          default: `Ошибка: ${event.error}`
        };

        setStatus(errorMessages[event.error] || errorMessages.default);
      };
    };

    const checkMicrophonePermission = async () => {
      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          permission.onchange = () => {
            if (permission.state === 'denied') {
              setBrowserSupport(false);
              setStatus('Доступ к микрофону запрещен');
            }
          };
        }
      } catch (e) {
        console.log('Permission API not supported');
      }
    };

    initSpeechRecognition();
    checkMicrophonePermission();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processVoiceCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    console.log('Обработка команды:', lowerCommand);

    const words = lowerCommand.split(/\s+/);
    let triggerCalculation = false;

    for (let i = 0; i < words.length; i++) {
      if (words[i] === 'калибр') {
        const num = parseFloat(words[i + 1]);
        if (!isNaN(num)) {
          const foundBullet = allBullets.find(b => parseFloat(b.caliber) === num);
          if (foundBullet) {
            setBullet(foundBullet);
            setStatus(`Выбран калибр ${num} мм`);
          } else {
            setStatus(`Калибр ${num} мм не найден`);
          }
        }
      }

      if (words[i] === 'скорость') {
        const num = parseInt(words[i + 1]);
        if (!isNaN(num)) {
          setInputValues(prev => ({ ...prev, velocity: num }));
          setStatus(`Установлена скорость: ${num} м/с`);
        }
      }

      if (words[i] === 'ветер') {
        const speed = parseInt(words[i + 1]);
        const angle = parseInt(words[i + 2]) || 90;
        if (!isNaN(speed)) {
          setConditions(prev => ({ ...prev, windSpeed: speed, windAngle: angle }));
          setStatus(`Ветер: ${speed} м/с, угол ${angle}°`);
        }
      }

      if (words[i] === 'пристрелка') {
        const distance = parseInt(words[i + 1]);
        if (!isNaN(distance)) {
          setInputValues(prev => ({ ...prev, zeroRange: distance }));
          setStatus(`Установлена пристрелка: ${distance} м`);
        }
      }

      if (words[i] === 'температура') {
        const temp = parseInt(words[i + 1]);
        if (!isNaN(temp)) {
          setConditions(prev => ({ ...prev, temperature: temp }));
          setStatus(`Температура установлена: ${temp}°C`);
        }
      }

      if (words[i] === 'давление') {
        const pressure = parseInt(words[i + 1]);
        if (!isNaN(pressure)) {
          setConditions(prev => ({ ...prev, pressure }));
          setStatus(`Давление установлено: ${pressure} мм рт.ст.`);
        }
      }

      if (words[i].includes('расчитай') || words[i].includes('расчет') || words[i].includes('расчитать')) {
        triggerCalculation = true;
      }
    }

    if (triggerCalculation) {
      setTimeout(() => {
        onCalculate();
        setStatus('Запущен расчет траектории');
      }, 500); // Задержка чтобы успели примениться все set
    }
  };

  const toggleListening = () => {
    if (!browserSupport) return;

    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        setStatus('Подключение к сервису распознавания...');
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Microphone access error:', error);
      setStatus('Ошибка доступа к микрофону');
      setBrowserSupport(false);
    }
  };

  return (
    <div className="voice-control">
      <button
        onClick={toggleListening}
        disabled={!browserSupport}
        className={`voice-button ${isListening ? 'listening' : ''}`}
      >
        {isListening ? (
          <>
            <FaMicrophoneSlash /> Остановить
          </>
        ) : (
          <>
            <FaMicrophone /> Голосовое управление
          </>
        )}
        {!browserSupport && <FaExclamationTriangle className="warning-icon" />}
      </button>

      <div className={`voice-status ${status.includes('Ошибка') ? 'error' : ''}`}>
        {status}
      </div>

      <div className="voice-tips">
        <p>Примеры команд:</p>
        <ul>
          <li>"Калибр 7.62 мм"</li>
          <li>"Скорость 820 м/с"</li>
          <li>"Ветер 5 м/с 90 градусов"</li>
          <li>"Пристрелка 100 метров"</li>
          <li>"Температура 20 градусов"</li>
          <li>"Давление 760 миллиметров"</li>
          <li>"Рассчитай траекторию"</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceControl;
