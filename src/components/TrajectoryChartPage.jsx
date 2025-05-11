import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';

const TrajectoryChartPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const chartRef = useRef(null);

  useEffect(() => {
    if (!state?.results?.length) return;

    const ctx = chartRef.current.getContext('2d');
    const chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: state.results.map(r => r.range),
        datasets: [
          {
            label: 'Падение пули (см)',
            data: state.results.map(r => r.drop),
            borderColor: 'rgba(56, 175, 136, 1)',
            backgroundColor: 'rgba(56, 175, 136, 0.2)',
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: 'Отклонение по ветру (см)',
            data: state.results.map(r => r.windage.cm),
            borderColor: 'rgba(255, 68, 68, 1)',
            backgroundColor: 'rgba(218, 44, 44, 0.2)',
            borderWidth: 2,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text')
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Дистанция (м)',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text')
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text')
            }
          },
          y: {
            title: {
              display: true,
              text: 'Отклонение (см)',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text')
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text')
            }
          }
        }
      }
    });

    return () => {
      chartInstance.destroy();
    };
  }, [state]);

  return (
    <div className="chart-page" style={{ padding: '1rem' }}>
      <button className="btn-glow back-btn" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <div style={{ width: '100%', maxWidth: '700px', margin: '2rem auto' }}>
        <canvas ref={chartRef} width={700} height={300} />
      </div>
    </div>
  );
};

export default TrajectoryChartPage;
