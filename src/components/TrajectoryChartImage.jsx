import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TrajectoryChartImage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const results = state?.results || [];
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !results.length) return;

    new Chart(chartRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: results.map(r => r.range),
        datasets: [
          {
            label: 'Падение пули (см)',
            data: results.map(r => r.drop),
            borderColor: '#38af88',
            backgroundColor: 'rgba(56, 175, 136, 0.2)',
          },
          {
            label: 'Отклонение по ветру (см)',
            data: results.map(r => r.windage.cm),
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.2)',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }, [results]);

  return (
    <div style={{ padding: '1rem' }}>
      <button className="btn-glow" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <canvas ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
};

export default TrajectoryChartImage;
