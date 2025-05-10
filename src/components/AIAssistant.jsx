import { useState } from 'react';
import Markdown from 'react-markdown';
import {FiSmile, FiLoader} from 'react-icons/fi';

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
          messages: [
            {
              role: "system",
              content: isFieldMode
                ? "Ты военный баллистик. Давай краткие четкие рекомендации для полевых условий на русском языке."
                : "Ты профессиональный баллистик. Давай развернутый анализ с техническими деталями на русском языке."
            },
            {
              role: "user",
              content: prompt
            }
          ],
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
      return `Дай краткие практические рекомендации для стрельбы в полевых условиях:\n- Патрон: ${data.bullet.caliber} ${data.bullet.name}\n- Ветер: ${data.conditions.windSpeed} м/с, угол ${data.conditions.windAngle}°\n- Основные поправки на 100м, 200м, 300м\nФормат: маркированный список из 3-5 пунктов`;
    }

    return `Дай детальный баллистический анализ:\n**Патрон**: ${data.bullet.caliber} ${data.bullet.name} (${data.bullet.weight}г, BC ${data.bullet.bc})\n**Погода**: ветер ${data.conditions.windSpeed} м/с, ${data.conditions.temperature}°C, ${data.conditions.pressure} мм рт.ст.\n**Траектория**:\n${data.trajectory
      .filter((_, i) => i % 3 === 0)
      .map(r => `${r.range}м: ↓${r.drop.toFixed(1)}см, ↷${r.windage.moa.toFixed(1)}MOA`).join('\n')}
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
    <div className={`ai-assistant card-glass ${isFieldMode ? 'field-mode' : ''}`}>
      <div className="section-title-row">
        <h3 className="section-title" style={{margin:'0'}}><FiSmile className="section-icon" />{isFieldMode ? 'Рекомендации' : 'Баллистический анализ'}</h3>
        <button className="btn" onClick={generateRecommendations} disabled={isLoading || !bullet}>
          {isLoading ? (<><FiLoader className="spin" /> Анализ...</>) : 'Получить рекомендации'}
        </button>
      </div>

      <div className="ai-content">
        {isLoading ? (
          <div className="center">
            <div className="loader" />
            <p>Генерация рекомендаций...</p>
          </div>
        ) : (
          <div className="recommendations">
            {error && <div className="error" style={{ color: 'tomato', marginBottom: '0.5rem' }}>{error}</div>}
            <div className="markdown-content">
              <Markdown>
                {recommendations || (isFieldMode
                  ? 'Нажмите кнопку для кратких рекомендаций'
                  : 'Нажмите кнопку для полного анализа')}
              </Markdown>
            </div>
            {lastUpdated && (
              <div className="last-updated" style={{ fontSize: '0.8rem', color: 'gray' }}>
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
