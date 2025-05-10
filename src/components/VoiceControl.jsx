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
  setShouldCalculate,
  visible = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(true);

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
    };

    recognizer.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ')
        .trim()
        .toLowerCase();

      if (!transcript) return;

      if (transcript.includes('стоп')) {
        recognizer._forceStopped = true;
        recognizer.stop();
        return;
      }

      processVoiceCommand(transcript);
    };

    recognizer.onerror = (event) => {
      if (!recognizer._forceStopped) {
        console.error('Speech recognition error:', event.error);
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
      }
    };

    return () => {
      recognizer._forceStopped = true;
      recognizer.stop();
    };
  }, []);

  const processVoiceCommand = (text) => {
    let trigger = false;
    const iv = inputValuesRef.current;
    const c = conditionsRef.current;

    if (text.includes('расчитай')) trigger = true;

    if (text.includes('скорость')) {
      const match = text.match(/скорость\s(\d+)/);
      if (match) {
        setInputValues({ ...iv, velocity: parseInt(match[1]) });
      }
    }

    if (text.includes('ветер')) {
      const match = text.match(/ветер\s(\d+)(?:.*?(\d+))?/);
      if (match) {
        setConditions({
          ...c,
          windSpeed: parseInt(match[1]),
          windAngle: parseInt(match[2]) || 90
        });
      }
    }

    if (text.includes('пристрелка')) {
      const match = text.match(/пристрелка\s(\d+)/);
      if (match) {
        setInputValues({ ...iv, zeroRange: parseInt(match[1]) });
      }
    }

    if (trigger && bulletRef.current && iv.velocity) {
      setShouldCalculate(true);
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

  if (!visible) return null;

  return (
    <div className="voice-control full-width">
      <button
        onClick={toggleListening}
        disabled={!browserSupport}
        className={`btn-glow voice-button action-btn ${isListening ? 'listening' : ''}`}
      >
        {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
        {!browserSupport && <FaExclamationTriangle className="warning-icon" />}
      </button>
    </div>
  );
}; 

export default VoiceControl;
