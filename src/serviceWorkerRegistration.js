export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('ServiceWorker успешно зарегистрирован:', registration);
          
          // Проверка обновлений каждые 24 часа
          setInterval(() => {
            registration.update();
          }, 86400000);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('Доступно новое обновление приложения');
                  if (config && config.onUpdate) {
                    config.onUpdate(registration);
                  }
                } else {
                  console.log('Приложение готово к работе в оффлайн-режиме');
                  if (config && config.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Ошибка регистрации ServiceWorker:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}