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
    // Проверка поддержки API
    const initSpeechRecognition = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setBrowserSupport(false);
        setStatus('Ваш браузер не поддерживает голосовой ввод');
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      const recognizer = recognitionRef.current;

      // Настройки
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'ru-RU';

      // Обработчики событий
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
          .join('')
          .trim();
        
        if (transcript) processVoiceCommand(transcript);
      };

      recognizer.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Специальная обработка сетевой ошибки
        if (event.error === 'network') {
          setStatus('Ошибка сети. Проверьте подключение к интернету');
          setTimeout(() => setStatus('Нажмите микрофон для начала'), 3000);
          return;
        }
        
        // Остальные ошибки
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

    // Проверка разрешений микрофона
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
    command = command.toLowerCase();
    console.log('Обработка команды:', command);

    // Обработка команд...
    // ... (остальной код обработки команд без изменений)
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
          <li>"Рассчитай траекторию"</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceControl;