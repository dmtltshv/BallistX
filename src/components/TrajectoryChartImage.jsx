import { useLocation, useNavigate } from 'react-router-dom';

const TrajectoryChartImage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const imageDataUrl = state?.imageDataUrl;

  if (!imageDataUrl) {
    return (
      <div className="chart-page">
        <p>График не загружен. Вернитесь назад и попробуйте снова.</p>
        <button className="btn-glow" onClick={() => navigate(-1)}>← Назад</button>
      </div>
    );
  }

  return (
    <div className="chart-page" style={{ padding: '1rem', textAlign: 'center' }}>
      <button className="btn-glow" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        ← Назад
      </button>
      <img src={imageDataUrl} alt="График траектории" style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  );
};

export default TrajectoryChartImage;
