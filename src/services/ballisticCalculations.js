export const calculateTrajectory = ({
    bullet,
    initialVelocity,
    zeroRange,
    scopeHeight,
    conditions,
    maxRange,
    step,
  }) => {
    const g = 9.80665;
    const results = [];
    scopeHeight = scopeHeight / 1000;
    
    const airDensity = (temperature, pressure, humidity) => {
      const R = 287.05;
      const Rv = 461.495;
      const T = temperature + 273.15;
      const p = pressure * 133.322;
      const es = 6.1078 * Math.exp((17.1 * temperature) / (234.175 + temperature)) * 100;
      const e = (humidity / 100) * es;
      return (p / (R * T)) * (1 - (0.378 * e) / p);
    };
  
    const rho = airDensity(conditions.temperature, conditions.pressure, conditions.humidity);
  
    let x = 0, y = 0, v = initialVelocity, vx = initialVelocity, vy = 0, time = 0;
  
    results.push({
      range: Math.round(x),
      velocity: v,
      energy: 0.5 * bullet.mass * Math.pow(v, 2),
      drop: 0,
      correction: { cm: 0, moa: 0, mil: 0 },
      windage: { cm: 0, moa: 0, mil: 0 },
      time: time,
    });
  
    let dt = 0.00005;
    let nextReportRange = step;
  
    while (x <= maxRange) {
      const dragForce = (velocity, bc) => {
        const area = Math.PI * Math.pow(bullet.diameter / 2000, 2);
        return 0.5 * rho * Math.pow(velocity, 2) * bc * area;
      };
  
      const retardation = dragForce(v, bullet.bc) / bullet.mass;
  
      const windEffect = (() => {
        const angleRad = (conditions.windAngle * Math.PI) / 180;
        const crosswind = conditions.windSpeed * Math.sin(angleRad);
        const headwind = conditions.windSpeed * Math.cos(angleRad);
        const crosswindEffect = bullet.bc * crosswind * (v / 1000);
        const headwindEffect = bullet.bc * headwind * (v / 1000);
  
        return {
          horizontal: crosswindEffect,
          vertical: headwindEffect,
          total: Math.sqrt(Math.pow(crosswindEffect, 2) + Math.pow(headwindEffect, 2)),
        };
      })();
  
      // Runge-Kutta 4th order implementation
      const k1vx = (-retardation * vx) / v - windEffect.horizontal;
      const k1vy = -g - (retardation * vy) / v - windEffect.vertical;
  
      const k2vx = (-retardation * (vx + 0.5 * dt * k1vx)) / v - windEffect.horizontal;
      const k2vy = -g - (retardation * (vy + 0.5 * dt * k1vy)) / v - windEffect.vertical;
  
      const k3vx = (-retardation * (vx + 0.5 * dt * k2vx)) / v - windEffect.horizontal;
      const k3vy = -g - (retardation * (vy + 0.5 * dt * k2vy)) / v - windEffect.vertical;
  
      const k4vx = (-retardation * (vx + dt * k3vx)) / v - windEffect.horizontal;
      const k4vy = -g - (retardation * (vy + dt * k3vy)) / v - windEffect.vertical;
  
      vx += (dt * (k1vx + 2 * k2vx + 2 * k3vx + k4vx)) / 6;
      vy += (dt * (k1vy + 2 * k2vy + 2 * k3vy + k4vy)) / 6;
  
      x += vx * dt;
      y += vy * dt;
      v = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));
      time += dt;
      dt = Math.min(0.001, 1 / v);
  
      if (x >= nextReportRange - 0.5 || x >= maxRange - 0.5) {
        const roundedRange = Math.min(Math.round(x / step) * step, maxRange);
        const drop = y - (Math.tan(Math.atan(scopeHeight / zeroRange)) * x - scopeHeight);
        const correction = {
          cm: drop * 100,
          moa: ((drop * 100) / roundedRange) * (100 / 2.9089),
          mil: ((drop * 100) / roundedRange) * 10,
        };
  
        const windage = {
          cm: windEffect.total * time * 100,
          moa: Math.atan((windEffect.total * time * 100) / 100 / roundedRange) * ((60 * 180) / Math.PI),
          mil: ((windEffect.total * time * 100) / roundedRange) * 10,
        };
  
        results.push({
          range: roundedRange,
          velocity: v,
          energy: 0.5 * bullet.mass * Math.pow(v, 2),
          drop: drop * 100,
          correction,
          windage,
          time,
        });
  
        nextReportRange = roundedRange + step;
        if (roundedRange >= maxRange) break;
      }
    }
  
    return results;
  };