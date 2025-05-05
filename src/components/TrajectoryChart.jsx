import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

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
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            yAxisID: 'y',
          },
          {
            label: 'Ветер (см)',
            data: results.map(r => r.windage.cm),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Дистанция (м)',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Отклонение (см)',
            },
            beginAtZero: false,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [results]);

  return <canvas ref={chartRef} />;
};

export default TrajectoryChart;