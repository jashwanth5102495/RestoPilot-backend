export function calculateDynamicPrice(basePrice: number, restaurant: any): number {
  if (!restaurant || !restaurant.dynamicPricing?.enabled) return basePrice;
  
  const { startTime, endTime, percentage } = restaurant.dynamicPricing;
  if (!startTime || !endTime || percentage === undefined || percentage === null) return basePrice;

  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: restaurant.timezone || 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const hour = parts.find((p: any) => p.type === 'hour')?.value;
  const minute = parts.find((p: any) => p.type === 'minute')?.value;
  
  if (!hour || !minute) return basePrice;
  
  const currentTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  
  let isWithinRange = false;
  if (startTime <= endTime) {
    isWithinRange = currentTime >= startTime && currentTime <= endTime;
  } else {
    // Handles overnight ranges like 22:00 to 02:00
    isWithinRange = currentTime >= startTime || currentTime <= endTime;
  }
  
  if (isWithinRange) {
    const priceChange = basePrice * (percentage / 100);
    return Math.max(0, basePrice + priceChange);
  }
  
  return basePrice;
}

export function applyDynamicPricingToDishes(dishes: any[], restaurant: any): any[] {
  return dishes.map(dish => {
    const newPrice = calculateDynamicPrice(dish.price, restaurant);
    if (newPrice !== dish.price) {
      return {
        ...dish,
        originalPrice: dish.price,
        price: newPrice
      };
    }
    return dish;
  });
}
