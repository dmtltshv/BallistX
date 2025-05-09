import { useEffect, useRef, useState } from 'react';

export default function CameraOverlay({ onClose, results = [] }) {
  const videoRef = useRef(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [error, setError] = useState('');
  const [rawTilt, setRawTilt] = useState(0);
  const [smoothedTilt, setSmoothedTilt] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showAllMarkers, setShowAllMarkers] = useState(false);

  const fieldOfView = 60;
  const calibrationOffset = 0;
  const MIN_DISTANCE = 6;

  // ⏳ Сглаживание угла (low-pass filter)
  useEffect(() => {
    const interval = setInterval(() => {
      setSmoothedTilt((prev) => prev * 0.9 + rawTilt * 0.1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setShowWarning(Math.abs(smoothedTilt) > 80);
  }, [smoothedTilt]);

  // 📸 Камера + сенсоры
  const startCamera = async () => {
    try {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          alert('Разрешите доступ к сенсорам для работы прицела');
          return;
        }
      }

      window.addEventListener('deviceorientation', (event) => {
        if (event.beta != null) {
          const corrected = -(event.beta - 90) + calibrationOffset;
          setRawTilt(corrected);
          console.log('✅ rawTilt:', corrected.toFixed(1));
        }
      }, true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamStarted(true);
      }
    } catch (err) {
      console.error('Ошибка запуска камеры/сенсоров:', err);
      setError('Ошибка доступа к камере или сенсорам.');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    window.removeEventListener('deviceorientation', () => {}, true);
    onClose();
  };

  const calculateMarkerAngle = (drop, range) => {
    return range ? Math.atan2(drop / 100, range) * (180 / Math.PI) : 0;
  };

  const getMarkerColor = (range) => {
    if (range <= 300) return 'green-marker';
    if (range <= 600) return 'yellow-marker';
    return 'red-marker';
  };

  // 📌 Фильтрация меток
  const filteredResults = showAllMarkers
    ? results
    : results.filter(r => [100, 300, 500, 800, 1000].includes(r.range));

  const positionedMarkers = [];
  filteredResults.forEach((r) => {
    const markerAngle = calculateMarkerAngle(r.drop, r.range);
    const relativeAngle = markerAngle - smoothedTilt;
    if (Math.abs(relativeAngle) > fieldOfView / 2) return;

    let topPercent = 50 - (relativeAngle / (fieldOfView / 2)) * 50;
    topPercent = Math.max(5, Math.min(95, topPercent));

    while (positionedMarkers.some(m => Math.abs(m.top - topPercent) < MIN_DISTANCE)) {
      topPercent += MIN_DISTANCE;
      if (topPercent > 95) break;
    }

    positionedMarkers.push({ ...r, top: topPercent, relativeAngle });
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

          {positionedMarkers.map((r, index) => {
            const isTargeted = Math.abs(r.relativeAngle) < 2;
            const colorClass = getMarkerColor(r.range);

            return (
              <div
                key={index}
                className={`marker ${colorClass} ${isTargeted ? 'pulse' : ''}`}
                style={{
                  top: `${r.top}%`,
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div>{r.range} м</div>
                <div>↓ {r.drop.toFixed(1)} см</div>
                <div>→ {r.windage.moa.toFixed(1)} MOA</div>
              </div>
            );
          })}

          <div className="angle-indicator">
            Угол: {smoothedTilt.toFixed(1)}°
          </div>

          {showWarning && (
            <div className="warning-overlay">
              📢 Устройство слишком наклонено!<br />
              Выравнивание для точной стрельбы.
            </div>
          )}

          {/* Отладочный блок */}
          <div style={{
            position: 'absolute', bottom: '1rem', left: '1rem', color: '#fff',
            background: 'rgba(0,0,0,0.5)', padding: '0.5rem 0.7rem', borderRadius: '8px', fontSize: '0.9rem'
          }}>
            raw: {rawTilt.toFixed(1)}°<br />
            smooth: {smoothedTilt.toFixed(1)}°
          </div>
        </>
      )}

      <div className="camera-controls">
        {!streamStarted && (
          <button className="btn-glow start-btn" onClick={startCamera}>
            Включить камеру
          </button>
        )}
        <button className="btn-glow close-btn" onClick={stopCamera}>
          Закрыть
        </button>
        <button className="btn-glow toggle-btn" onClick={() => setShowAllMarkers(prev => !prev)}>
          {showAllMarkers ? 'Скрыть лишние' : 'Показать все'}
        </button>
        {error && <div className="camera-error">{error}</div>}
      </div>
    </div>
  );
}
