import { FiTable, FiCamera } from 'react-icons/fi';

const ResultsTable = ({ results, isFieldMode, onOpenCamera }) => {
  if (results.length === 0) return null;


  return (
    <div className={`results-table card-glass ${isFieldMode ? 'field-mode' : ''}`}>
      <div className="section-title-row">
        <h3 className="section-title" style={{margin:'0'}}>
          <FiTable className="section-icon" />
          Результаты расчета
        </h3>
        {onOpenCamera && (
          <button className="btn-glow" onClick={onOpenCamera}>
            <FiCamera className="section-icon"/>
          </button>
        )}
      </div>
      <div className="table-container">
        <table className="results-table full-width">
          <thead>
            <tr>
              <th>Дистанция (м)</th>
              <th>Скорость (м/с)</th>
              {!isFieldMode && <th>Энергия (Дж)</th>}
              <th>Падение (см)</th>
              <th>Поправка</th>
              <th>Ветер</th>
              {!isFieldMode && <th>Время (с)</th>}
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td>{result.range}</td>
                <td>{result.velocity.toFixed(1)}</td>
                {!isFieldMode && <td>{Math.round(result.energy)}</td>}
                <td>{result.drop.toFixed(1)}</td>
                <td>
                  {isFieldMode
                    ? `${result.correction.moa.toFixed(1)} MOA`
                    : `${result.correction.moa.toFixed(1)} MOA / ${result.correction.mil.toFixed(1)} тыс.`}
                </td>
                <td>
                  {isFieldMode
                    ? `${result.windage.moa.toFixed(1)} MOA`
                    : `${result.windage.moa.toFixed(1)} MOA / ${result.windage.mil.toFixed(1)} тыс.`}
                </td>
                {!isFieldMode && <td>{result.time.toFixed(3)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;