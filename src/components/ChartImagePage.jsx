import { useLocation, useNavigate } from 'react-router-dom';

const ChartImagePage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const imageDataUrl = state?.imageDataUrl;

  if (!imageDataUrl) {
    return (
      <div className="chart-page center">
        <p>График не найден. Попробуйте снова.</p>
        <button className="btn-glow" onClick={() => navigate('/')}>
          ← Назад
        </button>
      </div>
    );
  }

  return (
    <div className="chart-page center">
      <button className="btn-glow back-btn" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <img
        src={imageDataUrl}
        alt="График траектории"
        style={{ maxWidth: '100%', marginTop: '1rem' }}
      />
    </div>
  );
};

export default ChartImagePage;
