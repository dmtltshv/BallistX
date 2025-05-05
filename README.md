# 🎯 BallisticCalc Pro - Продвинутый баллистический калькулятор

![Скриншот приложения](screenshot.png)  
*Современный баллистический калькулятор с ИИ, AR и голосовым управлением*

## 🌟 Возможности

### Основные функции
- **Точные расчеты траектории** с 6DOF моделированием
- **Множество параметров**: скорость, пристрелка, высота прицела, погодные условия
- **Коррекции в реальном времени** для углов, наклона и атмосферных условий

### 🚀 Дополнительные функции
- **Рекомендации на базе ИИ** (Meta-Llama-3-70B-Instruct)
- **AR-визуализация** траектории пули
- **Голосовое управление** 
- **Оффлайн-режим** с хранением данных в IndexedDB

### 📊 Визуализация
- Интерактивные графики (Chart.js)
- Таблицы с конвертацией MOA/MIL
- Моделирование погодных условий

## 🛠 Установка

```bash
git clone https://github.com/ваш-аккаунт/ballistic-calculator.git
cd ballistic-calculator
npm install
npm run dev
```

## 📦 Сборка для production

```bash
npm run build
npm run preview
```

## 🌐 Развертывание

Поддерживаются:

- Статический хостинг (Vercel, Netlify)
- Докеризация
- Установка как PWA

```docker
docker build -t ballisticcalc .
docker run -p 3000:3000 ballisticcalc
```
## 🤖 Интеграция с ИИ
Используется Llama-3-70B через DeepInfra в двух режимах:

- Полевой режим: Краткие практические рекомендации

- Технический режим: Детальный баллистический анализ

```javascript
const prompt = createPrompt(data);
const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_DEEPINFRA_API_KEY}`
  },
  body: JSON.stringify({
    model: "meta-llama/Meta-Llama-3-70B-Instruct",
    messages: [/* системный и пользовательский промпты */],
    temperature: isFieldMode ? 0.3 : 0.7,
    max_tokens: isFieldMode ? 500 : 1000
  })
});
```
## 📱 PWA Конфигурация
Особенности:

- Работа оффлайн
- Установка на устройство
- Фоновое обновление
- Уведомления о новых версиях

```javascript
// service-worker.js
const CACHE_NAME = "ballistic-cache-v2";
const OFFLINE_URL = "/offline.html";

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([
        '/',
        '/index.html',
        '/assets/main.js',
        OFFLINE_URL
      ]))
  );
});
```
## 🌍 Погодная интеграция
Используется OpenWeatherMap API:

```javascript
const fetchWeather = async () => {
  const position = await getGeolocation();
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${import.meta.env.VITE_WEATHER_API_KEY}`
  );
  return processWeatherData(response);
};
```

## 📜 Лицензия
MIT License - Бесплатно для образовательных и некоммерческих целей