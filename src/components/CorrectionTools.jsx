import { useState } from 'react';
import { FiTrendingUp, FiRotateCcw, FiEdit } from 'react-icons/fi';

const CorrectionTools = ({ results, originalResults, setResults }) => {
  const [angleCorrection, setAngleCorrection] = useState({
    distance: '',
    elevation: '',
    angle: 0,
    factor: 1.0
  });

  const [tiltCorrection, setTiltCorrection] = useState({
    angle: '',
    direction: 'left',
    shift: 0,
    windCorrection: 0
  });

  const calculateAngleCorrection = () => {
    const distance = parseFloat(angleCorrection.distance);
    const elevation = parseFloat(angleCorrection.elevation);

    if (!distance || !elevation) {
      alert("Введите дистанцию и перепад высот");
      return;
    }

    const angleRad = Math.atan2(elevation, distance);
    const angleDeg = (angleRad * 180 / Math.PI).toFixed(1);
    const factor = Math.cos(angleRad).toFixed(3);

    setAngleCorrection({
      ...angleCorrection,
      angle: angleDeg,
      factor: factor
    });

    applyCorrections(angleRad, parseFloat(tiltCorrection.angle), tiltCorrection.direction);
  };

  const calculateTiltCorrection = () => {
    const tiltAngle = parseFloat(tiltCorrection.angle);
    const direction = tiltCorrection.direction;

    if (!tiltAngle) {
      alert("Введите угол наклона");
      return;
    }

    const tiltRad = (tiltAngle * Math.PI) / 180;
    const shift = (Math.sin(tiltRad) * 100).toFixed(1);
    const windCorrection = direction === 'left' 
      ? (Math.tan(tiltRad) * 3.44).toFixed(2) 
      : (-Math.tan(tiltRad) * 3.44).toFixed(2);

    setTiltCorrection({
      ...tiltCorrection,
      shift: shift,
      windCorrection: windCorrection
    });

    applyCorrections(parseFloat(angleCorrection.angle), tiltRad, direction);
  };

  const applyCorrections = (angleRad, tiltRad, tiltDirection) => {
    if (!originalResults || originalResults.length === 0) return;

    let correctedResults = [...originalResults];

    if (angleRad) {
      const factor = Math.cos(angleRad);
      correctedResults = correctedResults.map(result => ({
        ...result,
        drop: result.drop * factor,
        windage: {
          cm: result.windage.cm * factor,
          moa: result.windage.moa * factor,
          mil: result.windage.mil * factor,
        }
      }));
    }

    if (tiltRad) {
      correctedResults = correctedResults.map(result => {
        const distance = result.range;
        const shift = Math.sin(tiltRad) * distance;
        const windCorrection = tiltDirection === 'left'
          ? ((Math.tan(tiltRad) * distance) / 100 * 3.44)
          : ((-Math.tan(tiltRad) * distance) / 100 * 3.44);

        return {
          ...result,
          windage: {
            cm: result.windage.cm + (tiltDirection === 'left' ? shift : -shift),
            moa: result.windage.moa + windCorrection,
            mil: result.windage.mil + (windCorrection / 3.44) * 10,
          }
        };
      });
    }

    setResults(correctedResults);
  };

  const resetCorrections = () => {
    setResults([...originalResults]);
    setAngleCorrection({
      distance: '',
      elevation: '',
      angle: 0,
      factor: 1.0
    });
    setTiltCorrection({
      angle: '',
      direction: 'left',
      shift: 0,
      windCorrection: 0
    });
  };

  return (
  <div className="correction-tools card-glass">
    <h3 className="section-title">
      <FiEdit className="section-icon" /> Коррекции
    </h3>

    <div className="correction-section">
      <h4 className="sub-item"><FiTrendingUp /> Угол места</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Дистанция (м):</label>
          <input
            type="number"
            value={angleCorrection.distance}
            onChange={(e) => setAngleCorrection({ ...angleCorrection, distance: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Перепад высот (м):</label>
          <input
            type="number"
            value={angleCorrection.elevation}
            onChange={(e) => setAngleCorrection({ ...angleCorrection, elevation: e.target.value })}
          />
        </div>
      </div>
      <button onClick={calculateAngleCorrection} className="btn-glow">Рассчитать угол</button>
      <div className="correction-result text-sm">
        Угол: {angleCorrection.angle}°, Коэффициент: {angleCorrection.factor}
      </div>
    </div>

    <div className="correction-section">
      <h4 className="sub-item"><FiRotateCcw /> Наклон оружия</h4>
      <div className="form-row">
        <div className="form-group">
          <label>Угол наклона (°):</label>
          <input
            type="number"
            value={tiltCorrection.angle}
            onChange={(e) => setTiltCorrection({ ...tiltCorrection, angle: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Направление:</label>
          <select
            value={tiltCorrection.direction}
            onChange={(e) => setTiltCorrection({ ...tiltCorrection, direction: e.target.value })}
          >
            <option value="left">Влево</option>
            <option value="right">Вправо</option>
          </select>
        </div>
      </div>
      <button onClick={calculateTiltCorrection} className="btn-glow">Рассчитать наклон</button>
      <div className="correction-result text-sm">
        Смещение: {tiltCorrection.shift} см/100м, Поправка по ветру: {tiltCorrection.windCorrection} MOA
      </div>
    </div>

    <button onClick={resetCorrections} className="btn-glow btn-restart delete-btn">
       Сбросить коррекции
    </button>
  </div>
);
};

export default CorrectionTools;