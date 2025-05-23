import { useEffect, useRef, useState } from 'react';

export default function CameraOverlay({ onClose, results = [] }) {
  const videoRef = useRef(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [error, setError] = useState('');
  const [rawTilt, setRawTilt] = useState(0);
  const [tiltAngle, setTiltAngle] = useState(0);
  const [calibrationOffset, setCalibrationOffset] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [hiddenMarkers, setHiddenMarkers] = useState([]);

  const fieldOfView = 60;
  const MIN_DISTANCE = 6;
  const smoothFactor = 0.1;
  const angleAmplify = 1.5;

  const [showMarkers, setShowMarkers] = useState(true);

  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.beta != null) {
        setRawTilt(-(event.beta - 90)); // не учитываем offset
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
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  useEffect(() => {
    const smoothed = tiltAngle * (1 - smoothFactor) + rawTilt * smoothFactor;
    setTiltAngle(smoothed);
  }, [rawTilt]);

  useEffect(() => {
    setShowWarning(Math.abs(tiltAngle - calibrationOffset) > 80);
  }, [tiltAngle, calibrationOffset]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
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
    if (stream) stream.getTracks().forEach((track) => track.stop());
    onClose();
  };

  const handleSetZero = () => setCalibrationOffset(tiltAngle);

  const toggleMarker = (range) => {
    setHiddenMarkers((prev) =>
      prev.includes(range)
        ? prev.filter((r) => r !== range)
        : [...prev, range]
    );
  };

  const calculateMarkerAngle = (drop, range) => {
    if (!range) return 0;
    const radians = Math.atan2(drop / 100, range);
    return radians * (180 / Math.PI);
  };
  

  const getMarkerColor = (range) => {
    if (range <= 300) return 'green-marker';
    if (range <= 600) return 'yellow-marker';
    return 'red-marker';
  };

  const visibleMarkers = results.filter((r) => !hiddenMarkers.includes(r.range));

  const positionedMarkers = visibleMarkers
  .map((r) => {
    const markerAngle = calculateMarkerAngle(r.drop, r.range);
    const relativeAngle = markerAngle - (tiltAngle - calibrationOffset);
    if (Math.abs(relativeAngle) > fieldOfView / 2) return null;

    return {
      ...r,
      angle: markerAngle,
      relativeAngle,
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.relativeAngle - b.relativeAngle)
  .map((r) => {
    const top = Math.max(5, Math.min(95, 50 - (r.relativeAngle * 2)));
    return {
      ...r,
      top,
      isTargeted: Math.abs(top - 50) < 0.8,
      colorClass: getMarkerColor(r.range),
    };
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

          {positionedMarkers.map((r, i) => (
            <div
              key={i}
              className={`marker ${r.colorClass} ${r.isTargeted ? 'pulse' : ''}`}
              style={{ top: `${r.top}%`, left: '50%' }}
            >
              <div>{r.range} м</div>
              <div>↓ {r.drop.toFixed(1)} см</div>
              <div>→ {r.windage.moa.toFixed(1)} MOA</div>
            </div>
          ))}

          <div className="tilt-indicator">
            Угол: {(tiltAngle - calibrationOffset).toFixed(1)}°
          </div>

          <div style={{ position: 'absolute', top: '3.5rem', right: '1rem', zIndex: 10 }}>
            <button className="toggle-marker-list" onClick={() => setShowMarkers(prev => !prev)}>
              {showMarkers ? '▼ Метки' : '► Метки'}
            </button>
          </div>

          {showMarkers && (
            <div className="marker-filter-panel">
              <strong>Метки:</strong><br />
              {results.map((r, i) => (
                <div key={i}>
                  <input
                    type="checkbox"
                    checked={!hiddenMarkers.includes(r.range)}
                    onChange={() => toggleMarker(r.range)}
                  />
                  <label style={{ marginLeft: '0.5rem' }}>{r.range} м</label>
                </div>
              ))}
            </div>
          )}

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
        <button className="toggle-btn" onClick={handleSetZero}>
          Установить ноль
        </button>
        <button className="close-btn" onClick={stopCamera}>
          Закрыть
        </button>
        {error && <div className="camera-error">{error}</div>}
      </div>
    </div>
  );
}
