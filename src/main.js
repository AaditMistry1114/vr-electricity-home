import './style.css';
import { createScene } from './scene.js';
import { appliances, getAppliance } from './appliances.js';
import { buildControls, updateDashboard, initExtras } from './dashboard.js';

const world = createScene(document.getElementById('scene'));

function toggle(id) {
  const a = getAppliance(id);
  a.on = !a.on;
  world.setState(id, a.on); // update 3D
  updateDashboard();        // update numbers + tips
}

world.onApplianceClick(toggle);
buildControls(toggle);
initExtras({ onReset: () => appliances.forEach((a) => world.setState(a.id, a.on)) });
appliances.forEach((a) => world.setState(a.id, a.on));
updateDashboard();
