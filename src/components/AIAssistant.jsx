import { useState } from 'react';
import Markdown from 'react-markdown';
import { FiSmile, FiLoader } from 'react-icons/fi';

const AIAssistant = ({ results, bullet, conditions }) => {
  const [recommendations, setRecommendations] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const getAIRecommendations = async (data) => {
    try {
      const prompt = createPrompt(data);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          'X-Title': 'BallistX AI Assistant'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-prover-v2:free',
          messages: [
            {
              role: 'system',
              content: 'Ты профессиональный баллистик. Дай развернутый анализ с техническими деталями на русском языке.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();
      return result.choices[0]?.message?.content || 'Ответ от AI пуст';
    } catch (err) {
      console.error('AI request failed:', err);
      throw err;
    }
  };

  const createPrompt = ({ bullet, conditions, trajectory }) => {
    return `Ты профессиональный баллистик. Проанализируй баллистическую информацию и выдай структурированный, лаконичный и технически точный отчёт на русском языке. Стиль — инженерный справочник. Не используй вступления. Только по делу. Формат: заголовки и списки.

## Данные пули:
- Калибр: ${bullet.caliber}
- Название: ${bullet.name}
- Вес: ${bullet.weight} г
- Баллистический коэффициент (BC): ${bullet.bc}

## Условия:
- Температура: ${conditions.temperature}°C
- Давление: ${conditions.pressure} мм рт.ст.
- Ветер: ${conditions.windSpeed} м/с, угол ${conditions.windAngle}°

## Таблица отклонений:
${trajectory
  .filter((_, i) => i % 2 === 0 && i <= 12)
  .map(r => `- ${r.range}м: ↓${r.drop.toFixed(1)} см, →${r.windage.moa.toFixed(1)} MOA`)
  .join('\n')}

## Структура отчёта:

1. **Оптимальная пристрелка** — дистанция + объяснение.
2. **Поправки на ветер и температуру** — в цифрах.
3. **Анализ точности** — что сильнее всего влияет.
4. **Практические советы** — как стрелять точнее.
5. **Рекомендации по улучшению** — смена пуль, оборудования, подхода.`;
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
      setError('Ошибка подключения к AI. Проверьте интернет.');
      setRecommendations(getFallbackRecommendations());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackRecommendations = () => {
    return `## Оффлайн-анализ (сокращённый)

**Патрон:** ${bullet?.caliber || '-'} ${bullet?.name || '-'}

**Условия:**  
- Ветер: ${conditions.windSpeed} м/с  
- Температура: ${conditions.temperature}°C  

Для полного анализа требуется интернет-соединение.`;
  };

  return (
    <div className="ai-assistant card-glass">
      <div className="section-title-row">
        <h3 className="section-title" style={{ margin: '0' }}>
          <FiSmile className="section-icon" />
          Баллистический анализ
        </h3>
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
              <Markdown>{recommendations || 'Нажмите кнопку для получения анализа.'}</Markdown>
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
