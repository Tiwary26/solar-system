if (window.__solarAnimating__) {
  cancelAnimationFrame(window.__animationFrameID__);
  document.querySelectorAll("canvas").forEach(c => c.remove());
  window.__solarAnimating__ = false;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.zIndex = "1";
document.body.appendChild(renderer.domElement);

// Lighting
const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0x888888);
scene.add(ambientLight);

// Sun
const sunGeo = new THREE.SphereGeometry(2, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// Sun glow sprite
const spriteMat = new THREE.SpriteMaterial({
  map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/lensflare/lensflare0.png'),
  color: 0xffaa00,
  transparent: true,
  opacity: 0.6
});
const sprite = new THREE.Sprite(spriteMat);
sprite.scale.set(10, 10, 1);
sun.add(sprite);

// Planet data
const planets = [
  { name: "Mercury", radius: 0.3, distance: 4, speed: 0.02, color: 0xaaaaaa },
  { name: "Venus", radius: 0.5, distance: 6, speed: 0.015, color: 0xffcc99 },
  { name: "Earth", radius: 0.6, distance: 8, speed: 0.01, color: 0x3366ff },
  { name: "Mars", radius: 0.5, distance: 10, speed: 0.008, color: 0xff3300 },
  { name: "Jupiter", radius: 0.9, distance: 13, speed: 0.006, color: 0xff9966 },
  { name: "Saturn", radius: 0.9, distance: 16, speed: 0.004, color: 0xffcc66 },
  { name: "Uranus", radius: 0.7, distance: 19, speed: 0.003, color: 0x66ccff },
  { name: "Neptune", radius: 0.7, distance: 22, speed: 0.002, color: 0x3366cc }
];

const planetMeshes = [];
const tooltip = document.createElement("div");
tooltip.style.position = "absolute";
tooltip.style.background = "black";
tooltip.style.color = "white";
tooltip.style.padding = "4px 8px";
tooltip.style.borderRadius = "4px";
tooltip.style.display = "none";
tooltip.style.pointerEvents = "none";
tooltip.style.zIndex = "20";
document.body.appendChild(tooltip);

const panel = document.createElement("div");
panel.style.position = "absolute";
panel.style.top = "10px";
panel.style.left = "10px";
panel.style.background = "rgba(0,0,0,0.6)";
panel.style.padding = "10px";
panel.style.borderRadius = "10px";
panel.style.color = "white";
panel.style.fontFamily = "monospace";
panel.style.zIndex = "10";
document.body.appendChild(panel);

planets.forEach((planet, i) => {
  planet.angle = 0;
  const geo = new THREE.SphereGeometry(planet.radius, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: planet.color,
    roughness: 0.7,
    metalness: 0.3
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.x = planet.distance;
  scene.add(mesh);
  planetMeshes.push(mesh);

  // Orbit trail
  const orbitPoints = [];
  for (let j = 0; j <= 64; j++) {
    const angle = (j / 64) * 2 * Math.PI;
    orbitPoints.push(new THREE.Vector3(Math.cos(angle) * planet.distance, 0, Math.sin(angle) * planet.distance));
  }
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMat = new THREE.LineBasicMaterial({ color: planet.color });
  const orbitTrail = new THREE.LineLoop(orbitGeo, orbitMat);
  scene.add(orbitTrail);

  // Slider
  const label = document.createElement("label");
  label.textContent = planet.name + ": ";
  label.style.display = "block";
  label.style.marginBottom = "2px";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0.001";
  slider.max = "0.1";
  slider.step = "0.001";
  slider.value = planet.speed;
  slider.style.width = "100px";
  slider.oninput = (e) => planet.speed = parseFloat(e.target.value);

  panel.appendChild(label);
  panel.appendChild(slider);
});

// Pause button
let isPaused = false;
const toggleBtn = document.createElement("button");
toggleBtn.innerText = "Pause";
toggleBtn.onclick = () => {
  isPaused = !isPaused;
  toggleBtn.innerText = isPaused ? "Resume" : "Pause";
};
toggleBtn.style.marginTop = "10px";
toggleBtn.style.width = "100%";
panel.appendChild(toggleBtn);
// Stars with depth
function addRealisticStars(count = 1500) {
  const geometry = new THREE.BufferGeometry();
  const positions = [], colors = [];

  for (let i = 0; i < count; i++) {
    const x = THREE.MathUtils.randFloatSpread(600);
    const y = THREE.MathUtils.randFloatSpread(600);
    const z = THREE.MathUtils.randFloatSpread(600);
    positions.push(x, y, z);

    const intensity = Math.random() * 0.6 + 0.4;
    colors.push(intensity, intensity, intensity);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    vertexColors: true,
    size: 1.5,
    sizeAttenuation: true
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}
const stars = addRealisticStars();

// Background sphere
const galaxyGeo = new THREE.SphereGeometry(300, 64, 64);
const galaxyMat = new THREE.MeshBasicMaterial({ color: 0x000011, side: THREE.BackSide });
const galaxy = new THREE.Mesh(galaxyGeo, galaxyMat);
scene.add(galaxy);

// Tooltip + Hover
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const index = planetMeshes.indexOf(obj);
    tooltip.innerText = planets[index].name;
    tooltip.style.left = event.clientX + 10 + "px";
    tooltip.style.top = event.clientY + 10 + "px";
    tooltip.style.display = "block";

    planetMeshes.forEach(m => m.material.emissive?.set(0x000000));
    obj.material.emissive?.set(0x333333);
  } else {
    tooltip.style.display = "none";
  }
});

// Animation
let theta = 0;
let targetPlanet = null;
camera.position.z = 40;
function animate() {
  window.__animationFrameID__ = requestAnimationFrame(animate);

  if (!isPaused) {
    planets.forEach((planet, i) => {
      planet.angle += planet.speed;
      const x = Math.cos(planet.angle) * planet.distance;
      const z = Math.sin(planet.angle) * planet.distance;
      planetMeshes[i].position.set(x, 0, z);
      planetMeshes[i].rotation.y += 0.05;
    });

    stars.rotation.y += 0.0002;
  }

  if (!targetPlanet) {
    theta += 0.001;
    camera.position.x = 40 * Math.sin(theta);
    camera.position.z = 40 * Math.cos(theta);
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}

if (!window.__solarAnimating__) {
  window.__solarAnimating__ = true;
  animate();
}

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
