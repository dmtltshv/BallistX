import { useLocation, useNavigate } from 'react-router-dom';
import TrajectoryChart from './TrajectoryChart';

const TrajectoryChartPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const results = state?.results || [];

  if (!results.length) {
    return (
      <div className="chart-page">
        <p>Нет данных для отображения графика. Вернитесь на главную.</p>
        <button className="btn-glow" onClick={() => navigate('/')}>На главную</button>
      </div>
    );
  }
  
  return (
    <div className="chart-page">
      <button className="btn-glow back-btn" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <TrajectoryChart results={results} />
    </div>
  );
};

export default TrajectoryChartPage;
