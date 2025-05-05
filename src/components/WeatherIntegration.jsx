import { useState } from 'react';
import { FaCloudSun, FaExclamationTriangle } from 'react-icons/fa';
import './WeatherIntegration.css';

const WeatherIntegration = ({ conditions, setConditions, disabled }) => {
  const [status, setStatus] = useState('Готов к запросу');
  const [isLoading, setIsLoading] = useState(false);

  const fetchWeather = async () => {
    if (disabled) {
      setStatus('Требуется интернет-соединение');
      setTimeout(() => setStatus('Готов к запросу'), 3000);
      return;
    }

    setIsLoading(true);
    setStatus('Определение местоположения...');

    try {
      const position = await getPosition();
      setStatus('Запрос погодных данных...');
      const weather = await getWeather(position.coords);
      updateConditions(weather);
      setStatus('Данные обновлены');
    } catch (error) {
      setStatus(`Ошибка: ${error.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus('Готов к запросу'), 3000);
    }
  };

  const getPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000
      });
    });
  };

  const getWeather = async (coords) => {
    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}&units=metric&lang=ru`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка запроса погоды');
    return await response.json();
  };

  const updateConditions = (weather) => {
    setConditions({
      ...conditions,
      temperature: Math.round(weather.main.temp),
      pressure: Math.round(weather.main.pressure * 0.750062),
      humidity: weather.main.humidity,
      windSpeed: Math.round(weather.wind.speed),
      windAngle: weather.wind.deg || 0
    });
  };

  return (
    <div className="weather-integration">
      <button 
        onClick={fetchWeather}
        disabled={isLoading || disabled}
        className="weather-button"
      >
        <FaCloudSun /> Автозаполнение погоды
      </button>
      <div className={`weather-status ${status.includes('Ошибка') ? 'error' : ''}`}>
        {status.includes('Ошибка') ? <FaExclamationTriangle /> : null}
        {status}
      </div>
    </div>
  );
};

export default WeatherIntegration;