import { useState, useEffect } from 'react';
import {FiCloud, FiDivideCircle, FiDownloadCloud} from 'react-icons/fi';
import ballisticData from '../data/ballisticData';
import VoiceControl from './VoiceControl';
import WeatherIntegration from './WeatherIntegration';

const InputForm = ({
  bullet,
  setBullet,
  inputValues,
  setInputValues,
  conditions,
  setConditions,
  isFieldMode,
  onCalculate,
  results,
  setResults,
  setOriginalResults,
  customBullets = []
}) => {
  const [calibers, setCalibers] = useState([]);
  const [filteredBullets, setFilteredBullets] = useState([]);
  const [selectedCaliber, setSelectedCaliber] = useState('');
  const [shouldCalculate, setShouldCalculate] = useState(false);

  const allBullets = [...ballisticData, ...customBullets];

  useEffect(() => {
    const uniqueCalibers = [...new Set(allBullets.map(b => b.caliber))];
    setCalibers(uniqueCalibers);

    if (bullet) {
      setSelectedCaliber(bullet.caliber);
      const filtered = allBullets.filter(b => b.caliber === bullet.caliber);
      setFilteredBullets(filtered);
    }
  }, [bullet, customBullets]);

  useEffect(() => {
    if (shouldCalculate) {
      onCalculate();
      setShouldCalculate(false);
    }
  }, [shouldCalculate, onCalculate]);

  const handleCaliberChange = (e) => {
    const caliber = e.target.value;
    setSelectedCaliber(caliber);
    const filtered = allBullets.filter(b => b.caliber === caliber);
    setFilteredBullets(filtered);
    setBullet(null);
  };

  const handleBulletSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const selected = allBullets.find(b => b.id === selectedId);
    setBullet(selected);
  };

  return (
    <div className={`input-form card-glass ${isFieldMode ? 'field-mode' : ''}`}>
      <div className="form-card">
      <h2 className="section-title">
        <FiDivideCircle className="section-icon" />
        Параметры расчета
      </h2>
        <div className="form-group">
          <label>Калибр:</label>
          <select value={selectedCaliber} onChange={handleCaliberChange} className="form-control">
            <option value="">Выберите калибр</option>
            {calibers.map(caliber => (
              <option key={caliber} value={caliber}>{caliber}</option>
            ))}
          </select>
        </div>
  
        <div className="form-group">
          <label>Пуля:</label>
          <div className="bullet-select-wrapper">
            <select
              value={bullet?.id || ''}
              onChange={handleBulletSelect}
              className="form-control"
              disabled={!selectedCaliber}
            >
              <option value="">{selectedCaliber ? 'Выберите пулю' : 'Сначала выберите калибр'}</option>
              {filteredBullets.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.weight}г, BC: {b.bc})
                </option>
              ))}
            </select>
          </div>
        </div>
  
        <div className="form-row">
          <div className="form-group">
            <label>Скорость (м/с):</label>
            <input
              type="number"
              value={inputValues.velocity}
              onChange={(e) => setInputValues({ ...inputValues, velocity: e.target.value })}
              className="form-control"
              placeholder="Например: 800"
            />
          </div>
          <div className="form-group">
            <label>Пристрелка (м):</label>
            <input
              type="number"
              value={inputValues.zeroRange}
              onChange={(e) => setInputValues({ ...inputValues, zeroRange: e.target.value })}
              className="form-control"
            />
          </div>
        </div>
  
        {!isFieldMode && (
          <div className="form-row">
            <div className="form-group">
              <label>Макс. дистанция (м):</label>
              <input
                type="number"
                value={inputValues.maxRange}
                onChange={(e) => setInputValues({ ...inputValues, maxRange: e.target.value })}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Шаг расчета (м):</label>
              <input
                type="number"
                value={inputValues.step}
                onChange={(e) => setInputValues({ ...inputValues, step: e.target.value })}
                className="form-control"
              />
            </div>
          </div>
        )}
  
        <div className="form-group">
          <label>Высота прицела (мм):</label>
          <input
            type="number"
            value={inputValues.scopeHeight}
            onChange={(e) => setInputValues({ ...inputValues, scopeHeight: e.target.value })}
            className="form-control"
          />
        </div>
      </div>
  
      <div className="form-card weather-card">
        <h3 className="section-title" data-icon="">
          <FiCloud/>
          Погодные условия
        </h3>
  
        <div className="form-row">
          <div className="form-group">
            <label>Ветер (м/с):</label>
            <input
              type="number"
              value={conditions.windSpeed}
              onChange={(e) => setConditions({ ...conditions, windSpeed: e.target.value })}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Угол ветра (°):</label>
            <input
              type="number"
              value={conditions.windAngle}
              onChange={(e) => setConditions({ ...conditions, windAngle: e.target.value })}
              className="form-control"
              placeholder="90 - боковой ветер"
            />
          </div>
        </div>
  
        {!isFieldMode && (
          <div className="form-row">
            <div className="form-group">
              <label>Температура (°C):</label>
              <input
                type="number"
                value={conditions.temperature}
                onChange={(e) => setConditions({ ...conditions, temperature: e.target.value })}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Давление (мм рт.ст.):</label>
              <input
                type="number"
                value={conditions.pressure}
                onChange={(e) => setConditions({ ...conditions, pressure: e.target.value })}
                className="form-control"
              />
            </div>
          </div>
        )}
      </div>
  
      <div className="action-buttons">
      {results.length == 0 && (
        <button className="btn-glow action-btn" onClick={onCalculate}>
           Рассчитать траекторию
        </button>
        )}
        {results.length > 0 && (
          <button
            className="btn-glow delete-btn"
            onClick={() => {
              setResults([]);
              setOriginalResults([]);
              localStorage.removeItem('ballistic-results'); // если ты сохраняешь результаты туда
            }}
          >
            Очистить результаты
          </button>
        )}
        
        {!isFieldMode && (
        <>
          <WeatherIntegration
            conditions={conditions}
            setConditions={setConditions}
            disabled={false}
            visible={true}
          >
            {({ fetchWeather, isLoading, status }) => (
              <button
                className="btn-glow action-btn"
                onClick={fetchWeather}
                disabled={isLoading}
              >
                {isLoading ? status : (status === 'Готов к запросу' ? 'Автопогода' : status)}
              </button>
            )}
          </WeatherIntegration>

          <VoiceControl
            bullet={bullet}
            setBullet={setBullet}
            inputValues={inputValues}
            setInputValues={setInputValues}
            conditions={conditions}
            setConditions={setConditions}
            allBullets={allBullets}
            setShouldCalculate={setShouldCalculate}
            visible={true}
          />
        </>
      )}
      </div>
    </div>
  );
};

export default InputForm;