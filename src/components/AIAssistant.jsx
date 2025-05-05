import { useState } from 'react';
import Markdown from 'react-markdown';
import { FaRobot, FaSyncAlt } from 'react-icons/fa';
import './AIAssistant.css';

const AIAssistant = ({ results, bullet, conditions, isFieldMode }) => {
  const [recommendations, setRecommendations] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const getAIRecommendations = async (data) => {
    try {
      const prompt = createPrompt(data);
      
      const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_DEEPINFRA_API_KEY}`
        },
        body: JSON.stringify({
          model: "meta-llama/Meta-Llama-3-70B-Instruct",
          messages: [{ 
            role: "system", 
            content: isFieldMode 
              ? "Ты военный баллистик. Давай краткие четкие рекомендации для полевых условий на русском языке." 
              : "Ты профессиональный баллистик. Давай развернутый анализ с техническими деталями на русском языке."
          }, { 
            role: "user", 
            content: prompt 
          }],
          temperature: isFieldMode ? 0.3 : 0.7,
          max_tokens: isFieldMode ? 500 : 1000
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();
      return result.choices[0]?.message?.content || "Не удалось получить ответ";
    } catch (err) {
      console.error("AI request failed:", err);
      throw err;
    }
  };

  const createPrompt = (data) => {
    if (isFieldMode) {
      return `Дай краткие практические рекомендации для стрельбы в полевых условиях:
- Патрон: ${data.bullet.caliber} ${data.bullet.name}
- Ветер: ${data.conditions.windSpeed} м/с, угол ${data.conditions.windAngle}°
- Основные поправки на 100м, 200м, 300м
Формат: маркированный список из 3-5 пунктов`;
    }

    return `Дай детальный баллистический анализ:
**Патрон**: ${data.bullet.caliber} ${data.bullet.name} (${data.bullet.weight}г, BC ${data.bullet.bc})
**Погода**: ветер ${data.conditions.windSpeed} м/с, ${data.conditions.temperature}°C, ${data.conditions.pressure} мм рт.ст.
**Траектория**:
${data.trajectory
  .filter((_, i) => i % 3 === 0)
  .map(r => `${r.range}м: ↓${r.drop.toFixed(1)}см, ↷${r.windage.moa.toFixed(1)}MOA`)
  .join('\n')}
Проанализируй: оптимальные дистанции, поправки на ветер, влияние погоды, практические советы.`;
  };

  const generateRecommendations = async () => {
    if (!bullet) return;
    
    setIsLoading(true);
    setError(null);
    setLastUpdated(new Date());

    try {
      const analysisData = { bullet, conditions, trajectory: results };
      const aiResponse = await getAIRecommendations(analysisData);
      setRecommendations(aiResponse);
    } catch (err) {
      console.error("AI Error:", err);
      setError("Ошибка подключения к AI. Проверьте интернет.");
      setRecommendations(getFallbackRecommendations());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackRecommendations = () => {
    if (isFieldMode) {
      return `1. Поправка на ветер: ${(conditions.windSpeed * 0.5).toFixed(1)} MOA/100м\n2. Основная дистанция: ${results[3]?.range || 100}м\n3. Используйте баллистический калькулятор для точных значений`;
    }
    
    return `## Оффлайн-рекомендации\nДля точного анализа требуется интернет-соединение.\n\nОсновные параметры:\n- Калибр: ${bullet?.caliber || 'не выбран'}\n- Скорость ветра: ${conditions.windSpeed} м/с\n- Температура: ${conditions.temperature}°C`;
  };

  return (
    <div className={`ai-assistant ${isFieldMode ? 'field-mode' : ''}`}>
      <div className="ai-header">
        <h3>
          <FaRobot /> {isFieldMode ? 'Полевые рекомендации' : 'Баллистический анализ'}
        </h3>
        <button 
          onClick={generateRecommendations}
          disabled={isLoading || !bullet}
          className="ai-button"
        >
          {isLoading ? (
            <>
              <FaSyncAlt className="spin" /> Анализ...
            </>
          ) : (
            'Получить рекомендации'
          )}
        </button>
      </div>

      <div className="ai-content">
        {isLoading ? (
          <div className="loading">
            <div className="loader"></div>
            <p>Генерация рекомендаций...</p>
          </div>
        ) : (
          <div className="recommendations">
            {error && <div className="error">{error}</div>}
            <div className="markdown-content">
              <Markdown>
                {recommendations || (isFieldMode 
                  ? 'Нажмите кнопку для кратких рекомендаций' 
                  : 'Нажмите кнопку для полного анализа')}
              </Markdown>
            </div>
            {lastUpdated && (
              <div className="last-updated">
                Обновлено: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;