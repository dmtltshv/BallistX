import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { FiBarChart2 } from 'react-icons/fi';

const TrajectoryChart = ({ results }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  // Проверка ширины экрана
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 500);
    };
    handleResize(); // начальное значение
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Отрисовка Chart.js
  useEffect(() => {
    if (results.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    setChartReady(false); // сброс перед ререндером

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: results.map(r => r.range),
        datasets: [
          {
            label: 'Падение пули (см)',
            data: results.map(r => r.drop),
            borderColor: 'rgba(56, 175, 136, 1)',
            backgroundColor: 'rgba(56, 175, 136, 0.2)',
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: 'Отклонение по ветру (см)',
            data: results.map(r => r.windage.cm),
            borderColor: 'rgba(255, 68, 68, 1)',
            backgroundColor: 'rgba(218, 44, 44, 0.2)',
            borderWidth: 2,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          onComplete: () => {
            setChartReady(true);
          }
        },
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
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [results]);

  const openGraphInNewTab = () => {
    if (!chartReady || !chartRef.current) {
      alert('График ещё загружается...');
      return;
    }
    const dataUrl = chartRef.current.toDataURL();
    const newTab = window.open();
    newTab.document.write(`<img src="${dataUrl}" alt="Trajectory Chart" style="max-width: 100%;" />`);
    newTab.document.title = "График траектории";
  };

  return (
    <div className="trajectory-chart card-glass">
      <h3 className="section-title">
        <FiBarChart2 className="section-icon" /> График траектории
      </h3>

      {isMobile && (
        <button className="btn-glow action-btn" onClick={openGraphInNewTab} style={{margin:"auto"}}>
          Открыть график
        </button>
      )}

      <div className={`chart-scroll-wrapper ${isMobile ? 'visually-hidden' : ''}`}>
        <canvas ref={chartRef} width={700} height={300} />
      </div>
    </div>
  );
};

export default TrajectoryChart;
