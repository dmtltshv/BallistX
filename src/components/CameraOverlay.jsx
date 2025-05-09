import React, { useEffect, useState } from 'react';
import './CameraOverlay.css';

const DISTANCE_MARKS = [100, 200, 300, 400, 500]; // Примерные дистанции

const CameraOverlay = ({ currentAngle }) => {
  const [pulseIndex, setPulseIndex] = useState(null);

  // Примерная функция для расчета угла возвышения на основе дистанции
  const getAngleForDistance = (distance) => {
    // Замените на реальную баллистическую формулу
    return distance / 25; // Условная формула
  };

  useEffect(() => {
    const tolerance = 1.5; // Допустимая погрешность в градусах
    const foundIndex = DISTANCE_MARKS.findIndex(
      (distance) => Math.abs(getAngleForDistance(distance) - currentAngle) < tolerance
    );
    setPulseIndex(foundIndex);
  }, [currentAngle]);

  return (
    <div className="camera-overlay">
      {/* Прицел */}
      <div className="crosshair" />

      {/* Индикатор угла */}
      <div className="angle-indicator">
        {currentAngle.toFixed(1)}°
      </div>

      {/* Метки дистанций */}
      <div className="distance-marks">
        {DISTANCE_MARKS.map((distance, index) => {
          const angle = getAngleForDistance(distance);
          const topPosition = `${50 - angle}%`; // Примерное позиционирование
          return (
            <div
              key={distance}
              className={`distance-mark ${index === pulseIndex ? 'pulse' : ''}`}
              style={{ top: topPosition }}
            >
              {distance}м
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CameraOverlay;
