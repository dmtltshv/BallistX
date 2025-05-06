import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, ARButton } from '@react-three/xr';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import './ARViewer.css';

const TrajectoryLine = ({ trajectory }) => {
  const points = trajectory.map(point => 
    new THREE.Vector3(point.range / 100, -point.drop / 100, point.windage.cm / 100)
  );

  return (
    <line>
      <bufferGeometry attach="geometry" args={[new THREE.BufferGeometry().setFromPoints(points)]} />
      <lineBasicMaterial attach="material" color="red" linewidth={2} />
    </line>
  );
};

const WindIndicator = ({ windData }) => {
  const dir = new THREE.Vector3(
    Math.cos(windData.angle * Math.PI / 180),
    0,
    Math.sin(windData.angle * Math.PI / 180)
  ).normalize();

  return (
    <arrowHelper args={[dir, new THREE.Vector3(0, 0, 0), windData.speed / 5, 'cyan']} />
  );
};

const ARViewer = ({ trajectory, windData, onClose }) => {
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkARSupport = async () => {
      if (!navigator.xr) {
        setError('WebXR не поддерживается вашим браузером.');
        setSupported(false);
        return;
      }

      try {
        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        setSupported(isSupported);
        if (!isSupported) {
          setError('Ваше устройство не поддерживает AR-режим.');
        }
      } catch (err) {
        console.error('Ошибка проверки поддержки AR:', err);
        setError('Ошибка при проверке поддержки AR.');
        setSupported(false);
      }
    };

    checkARSupport();
  }, []);

  if (!trajectory || trajectory.length === 0) {
    return (
      <div className="modal-overlay">
        <div className="ar-viewer">
          <div className="ar-error">Нет данных траектории для отображения</div>
          <button onClick={onClose} className="close-ar">Закрыть</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="ar-viewer">
        <div className="ar-header">
          <h3>AR Просмотр траектории</h3>
          <button onClick={onClose} className="close-ar">
            Закрыть
          </button>
        </div>

        {error ? (
          <div className="ar-error">{error}</div>
        ) : supported ? (
          <>
            <ARButton 
              sessionInit={{
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.body }
              }}
              className="ar-button"
            />
            <Canvas
              camera={{ position: [0, 0, 0.1], near: 0.01, far: 20 }}
              gl={{ antialias: true, alpha: true }}
            >
              <XR>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <TrajectoryLine trajectory={trajectory} />
                <WindIndicator windData={windData} />
                <gridHelper args={[10, 10]} rotation={[Math.PI / 2, 0, 0]} />
                <Text position={[0, 0.5, 0]} color="white" fontSize={0.2}>
                  Траектория пули
                </Text>
              </XR>
            </Canvas>
          </>
        ) : (
          <div className="ar-loading">Проверка поддержки AR...</div>
        )}
      </div>
    </div>
  );
};

export default ARViewer;
