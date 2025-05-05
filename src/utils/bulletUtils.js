export const groupBulletsByCaliber = (bullets) => {
    return bullets.reduce((acc, bullet) => {
      if (!acc[bullet.caliber]) {
        acc[bullet.caliber] = [];
      }
      acc[bullet.caliber].push(bullet);
      return acc;
    }, {});
  };
  
  export const sortBullets = (bullets) => {
    return [...bullets].sort((a, b) => a.weight - b.weight);
  };