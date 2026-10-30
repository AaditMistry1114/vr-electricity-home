import { appliances, settings, calcStats, energyKwh, wattsOf, resetAll } from './appliances.js';

const $ = (id) => document.getElementById(id);
const inr = (n) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (el, fallback = 0) => {
  const v = parseFloat(el.value);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

// One bill row per appliance: switch, watts, editable hours per day.
export function buildControls(onToggle) {
  $('rows').innerHTML = appliances.map((a) => `
    <tr id="row-${a.id}">
      <td>
        <div class="item">
          <button class="item-btn" id="btn-${a.id}" role="switch" aria-checked="true" aria-label="${a.name}">
            <span class="switch"></span>
            <span class="item-name">${a.name}</span>
          </button>
          <span class="item-sub"><span id="w-${a.id}"></span> W for
            <input class="hours" id="h-${a.id}" type="number" min="0" max="24" step="0.5" value="${a.hours}" aria-label="${a.name} hours per day" /> h a day</span>
        </div>
      </td>
      <td id="day-${a.id}"></td>
      <td id="mon-${a.id}"></td>
    </tr>`).join('');
  appliances.forEach((a) => {
    $(`btn-${a.id}`).addEventListener('click', () => onToggle(a.id));
    $(`h-${a.id}`).addEventListener('input', (e) => {
      a.hours = Math.min(24, num(e.target, 0));
      updateDashboard();
    });
  });
}

export function getRate() { return num($('rate'), 0); }

// Rate, budget, efficient-mode switch and reset button
export function initExtras({ onReset }) {
  $('rate').addEventListener('input', updateDashboard);
  $('budget').addEventListener('input', () => { settings.budget = num($('budget'), 0); updateDashboard(); });
  $('efficient').addEventListener('click', () => { settings.efficient = !settings.efficient; updateDashboard(); });
  $('reset').addEventListener('click', () => {
    resetAll();
    $('rate').value = 8;
    $('budget').value = settings.budget;
    appliances.forEach((a) => ($(`h-${a.id}`).value = a.hours));
    onReset();
    updateDashboard();
  });
}

function tipsFor() {
  const on = (id) => appliances.find((a) => a.id === id).on;
  const tips = [];
  if (on('tv')) tips.push('Switch the TV off at the wall when you are done. It is your biggest draw.');
  if (on('fan')) tips.push('Turn the fan off when you leave the room. It cools people, not the room.');
  if (on('light')) tips.push('Switch the light off in empty rooms and open the curtains in the daytime.');
  if (!settings.efficient) tips.push('Try the efficient appliances switch to see what an LED bulb, BLDC fan and LED TV would save.');
  if (!appliances.some((a) => a.on)) tips.push('Everything is off, so nothing is being drawn right now.');
  const longest = appliances.filter((a) => a.on).sort((x, y) => y.hours * wattsOf(y) - x.hours * wattsOf(x))[0];
  if (longest && longest.hours > 0) tips.push(`The ${longest.name.toLowerCase()} uses the most energy per day. Cutting its hours helps most.`);
  return tips;
}

export function updateDashboard() {
  const rate = getRate();
  const s = calcStats(rate);

  $('watts').textContent = `${s.currentWatts} W`;
  $('loadFill').style.width = `${s.maxWatts ? (s.currentWatts / s.maxWatts) * 100 : 0}%`;
  $('daily').textContent = `${s.dailyKwh.toFixed(2)} kWh`;
  $('monthly').textContent = `${s.monthlyKwh.toFixed(1)} kWh`;
  $('cost').textContent = inr(s.monthlyCost);
  $('co2').textContent = `${s.co2.toFixed(1)} kg CO₂`;
  $('saved').textContent = s.saved > 0.005
    ? `You are saving ${inr(s.saved)} a month compared with leaving everything on.` : '';

  // Efficient appliances switch
  const eff = $('efficient');
  eff.setAttribute('aria-checked', String(settings.efficient));
  $('effNote').textContent = settings.efficient
    ? (s.upgradeSaving > 0.005 ? `Saves ${inr(s.upgradeSaving)} a month over standard appliances.` : 'Turn an appliance on to see the saving.')
    : 'LED bulb 5 W, BLDC fan 35 W, LED TV 50 W';

  // Budget
  const budget = settings.budget;
  const pct = budget > 0 ? Math.min(100, (s.monthlyCost / budget) * 100) : 100;
  const over = s.monthlyCost > budget;
  $('budgetFill').style.width = `${pct}%`;
  $('budgetFill').classList.toggle('over', over);
  $('budgetMsg').textContent = over
    ? `${inr(s.monthlyCost - budget)} over your budget.`
    : `${inr(budget - s.monthlyCost)} under your budget.`;
  $('budgetMsg').classList.toggle('over', over);

  appliances.forEach((a) => {
    const day = energyKwh(wattsOf(a), a.hours);
    $(`btn-${a.id}`).setAttribute('aria-checked', String(a.on));
    $(`w-${a.id}`).textContent = wattsOf(a);
    $(`day-${a.id}`).textContent = a.on ? `${day.toFixed(2)} kWh` : 'Off';
    $(`mon-${a.id}`).textContent = a.on ? inr(day * 30 * rate) : '₹0.00';
    $(`day-${a.id}`).className = $(`mon-${a.id}`).className = a.on ? '' : 'off';
  });

  $('tips').innerHTML = tipsFor().map((t) => `<li>${t}</li>`).join('');
}
