import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import {FiBarChart2} from 'react-icons/fi'

const TrajectoryChart = ({ results }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (results.length === 0) return;

    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

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
            tension: 0.3,
            yAxisID: 'y',
          },
          {
            label: 'Отклонение по ветру (см)',
            data: results.map(r => r.windage.cm),
            borderColor: 'rgba(144, 113, 99, 1)',
            backgroundColor: 'rgba(144, 113, 99, 0.2)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true,
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
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [results]);

  return (
    <div className="trajectory-chart card-glass">
      <h3 className="section-title"> <FiBarChart2 className="section-icon" /> График траектории</h3>
      <canvas ref={chartRef} />
    </div>
  );
};

export default TrajectoryChart;