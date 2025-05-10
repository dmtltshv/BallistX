import { useEffect, useRef, useState } from 'react';

export default function CameraOverlay({ onClose, results = [] }) {
  const videoRef = useRef(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [error, setError] = useState('');
  const [tiltAngle, setTiltAngle] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const fieldOfView = 60;
  const calibrationOffset = 0;
  const MIN_DISTANCE = 6;

  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.beta != null) {
        const correctedTilt = -(event.beta - 90) + calibrationOffset;
        setTiltAngle(correctedTilt);
      }
    };

    const askPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        } catch (err) {
          console.error('Ошибка запроса разрешения на сенсоры:', err);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    };

    askPermission();
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  useEffect(() => {
    setShowWarning(Math.abs(tiltAngle) > 80);
  }, [tiltAngle]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            setStreamStarted(true);
          } catch (err) {
            console.error('Ошибка play():', err);
            setError('Ошибка запуска видео');
          }
        };
      }
    } catch (err) {
      console.error('Ошибка доступа к камере', err);
      setError('Ошибка доступа к камере.');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  const calculateMarkerAngle = (drop, range) => {
    if (!range) return 0;
    return Math.atan2(drop / 100, range) * (180 / Math.PI);
  };

  const getMarkerColor = (range) => {
    if (range <= 300) return 'green-marker';
    if (range <= 600) return 'yellow-marker';
    return 'red-marker';
  };

  // Подготовка маркеров
  const positionedMarkers = [];

  results
    .map((r) => {
      const markerAngle = calculateMarkerAngle(r.drop, r.range);
      const relativeAngle = markerAngle - tiltAngle;

      if (Math.abs(relativeAngle) > fieldOfView / 2) return null;

      let topPercent = 50 - (relativeAngle / (fieldOfView / 2)) * 50;
      topPercent = Math.max(5, Math.min(95, topPercent));

      return {
        ...r,
        top: topPercent,
        relativeAngle,
        isTargeted: Math.abs(relativeAngle) < 2,
        colorClass: getMarkerColor(r.range),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.top - b.top)
    .forEach((marker) => {
      while (positionedMarkers.some((m) => Math.abs(m.top - marker.top) < MIN_DISTANCE)) {
        marker.top += MIN_DISTANCE;
        if (marker.top > 95) break;
      }
      positionedMarkers.push(marker);
    });

  return (
    <div className="camera-overlay">
      <video ref={videoRef} autoPlay muted playsInline className="camera-video" />

      {streamStarted && (
        <>
          <div className="crosshair">
            <div className="crosshair-line horizontal" />
            <div className="crosshair-line vertical" />
          </div>

          {positionedMarkers.map((r, index) => (
            <div
              key={index}
              className={`marker ${r.colorClass} ${r.isTargeted ? 'pulse' : ''}`}
              style={{ top: `${r.top}%`, left: '50%' }}
            >
              <div>{r.range} м</div>
              <div>↓ {r.drop.toFixed(1)} см</div>
              <div>→ {r.windage.moa.toFixed(1)} MOA</div>
            </div>
          ))}

          <div className="tilt-indicator">
            Угол: {tiltAngle.toFixed(1)}°
          </div>

          {showWarning && (
            <div className="warning-overlay">
              Устройство слишком наклонено!<br />
              Выравнивание для точной стрельбы.
            </div>
          )}
        </>
      )}

      <div className="camera-controls">
        {!streamStarted && (
          <button className="start-btn" onClick={startCamera}>
            Включить камеру
          </button>
        )}
        <button className="close-btn" onClick={stopCamera}>
          Закрыть
        </button>
        {error && <div className="camera-error">{error}</div>}
      </div>
    </div>
  );
}
