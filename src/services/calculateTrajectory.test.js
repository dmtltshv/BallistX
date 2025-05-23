import { calculateTrajectory } from './ballisticCalculations';

test('расчёт траектории для стандартной пули', () => {
  const bullet = {
    mass: 0.0095,      // масса 9.5 г
    diameter: 7.62,    // калибр в мм
    bc: 0.4            // баллистический коэффициент
  };

  const result = calculateTrajectory({
    bullet,
    initialVelocity: 800,        // начальная скорость, м/с
    zeroRange: 100,              // дистанция пристрелки, м
    scopeHeight: 40,             // высота прицела, мм
    conditions: {
      temperature: 15,
      pressure: 760,
      humidity: 50,
      windSpeed: 0,
      windAngle: 90,
    },
    maxRange: 300,               // максимальная дальность, м
    step: 100                    // шаг по дальности, м
  });

  const closest = result.reduce((min, p) =>
    Math.abs(p.drop) < Math.abs(min.drop) ? p : min
  );
  

  // Убедимся, что расчёт вернул хотя бы несколько точек
  expect(result.length).toBeGreaterThan(1);

  // Проверим, что есть точка с дистанцией 100 м
  expect(result[1].range).toBe(100);

  // Проверим, что падение на дистанции пристрелки ≈ 0 (может быть не ровно 0)
  expect(Math.abs(closest.drop)).toBeLessThan(1);
  console.table(result);
});
