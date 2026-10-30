// Appliance data and energy calculations (no 3D code here).
export const appliances = [
  { id: 'light', name: 'Light',      icon: '💡', watts: 10,  efficientWatts: 5,  hours: 5, defaultHours: 5, on: true },
  { id: 'fan',   name: 'Fan',        icon: '🌀', watts: 75,  efficientWatts: 35, hours: 8, defaultHours: 8, on: true },
  { id: 'tv',    name: 'Television', icon: '📺', watts: 100, efficientWatts: 50, hours: 4, defaultHours: 4, on: true },
];

// Global settings the user can change
export const settings = { efficient: false, budget: 200 };
export const CO2_PER_KWH = 0.82; // kg CO2 per kWh (approx. Indian grid average)

export const wattsOf = (a) => (settings.efficient ? a.efficientWatts : a.watts);

// Energy (kWh) = Power (W) x Time (h) / 1000
export function energyKwh(watts, hours) {
  return (watts * hours) / 1000;
}

export function calcStats(rate) {
  const active = appliances.filter((a) => a.on);
  const currentWatts = active.reduce((sum, a) => sum + wattsOf(a), 0);
  const maxWatts = appliances.reduce((sum, a) => sum + wattsOf(a), 0);
  const dailyKwh = active.reduce((sum, a) => sum + energyKwh(wattsOf(a), a.hours), 0);
  const monthlyKwh = dailyKwh * 30;
  const monthlyCost = monthlyKwh * rate;
  const fullCost = appliances.reduce((sum, a) => sum + energyKwh(wattsOf(a), a.hours) * 30, 0) * rate;
  // Cost if the standard (non-efficient) appliances were used, same on/off + hours
  const standardCost = active.reduce((sum, a) => sum + energyKwh(a.watts, a.hours) * 30, 0) * rate;
  return {
    currentWatts, maxWatts, dailyKwh, monthlyKwh, monthlyCost,
    saved: fullCost - monthlyCost,
    upgradeSaving: standardCost - monthlyCost,
    co2: monthlyKwh * CO2_PER_KWH,
  };
}

export function getAppliance(id) {
  return appliances.find((a) => a.id === id);
}

export function resetAll() {
  appliances.forEach((a) => { a.on = true; a.hours = a.defaultHours; });
  settings.efficient = false;
  settings.budget = 200;
}
