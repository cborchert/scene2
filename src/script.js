import * as THREE from "three";

import "./styles.css";

const SPEED = 0.3;
const CAM_HEIGHT = 2;

let scene, camera, renderer, sky, clock, moonBox, pyramid;

/**
 * get a random number between 0 and 1 with a normal distribution
 */
function getRandomNormal() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return getRandomNormal(); // resample between 0 and 1
  return num;
}

init();
animate();

/**
 * Set things up
 */
function init() {
  setUpScene();
  setUpObjects();
}

/**
 * Set up the scene
 */
function setUpScene() {
  // set up scene, rendererer, camera
  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#canvas"),
  });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    20,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.y = CAM_HEIGHT;
  scene.add(camera);

  // update perspective when the window is resized
  function setPerspective() {
    const { innerWidth, innerHeight } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", setPerspective);
  setPerspective();

  // clock
  clock = new THREE.Clock();
  clock.start();

  // set up controls
  setUpControls();

  // add sky
  setUpSky();

  // lights
  const ambientLight = new THREE.AmbientLight(0xeeeeff, 0.1);
  scene.add(ambientLight);
}

function setUpControls() {
  const pointLight = new THREE.PointLight(0xffffdd, 0.2);
  pointLight.position.set(
    camera.position.x,
    camera.position.y,
    camera.position.z
  );
  pointLight.castShadow = true;
  scene.add(pointLight);
  const getMousePosition = (event) => {
    return {
      // calculate pointer position in normalized device coordinates => (-1 to +1) for both components
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };
  };

  window.addEventListener("pointermove", (event) => {
    const { x: mouseX, y: mouseY } = getMousePosition(event);
    const radius = 100;
    const angle = Math.PI * mouseX;
    const observedPoint = new THREE.Vector3(
      camera.position.x + Math.cos(angle) * radius,
      camera.position.y + Math.atan(Math.PI * mouseY) * radius,
      camera.position.z + Math.sin(angle) * radius
    );

    camera.lookAt(observedPoint);
  });

  window.addEventListener("keypress", (event) => {
    if (event.key === "w") {
      camera.translateZ(-1 * SPEED);
    }
    if (event.key === "s") {
      camera.translateZ(SPEED);
    }
    if (event.key === "a") {
      camera.translateX(-1 * SPEED);
    }
    if (event.key === "d") {
      camera.translateX(SPEED);
    }
    camera.position.y = 2;
    pointLight.position.set(
      camera.position.x,
      camera.position.y + 1,
      camera.position.z
    );
  });
}

/**
 * Create a starry sky
 */
function setUpSky() {
  sky = new THREE.Group();
  // add some particles for stars
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 2000;
  const particleGalacticCoreCount = 5000;
  const particlePositions = new Float32Array(
    (particleCount + particleGalacticCoreCount) * 3
  ); // 3 positions per particle x,y,z
  const particleBoundingBoxSizeOuter = 1000;
  const particleBoundingBoxSizeInner = 200;
  const getRandomPosition = (scale = 1, useNormal = false) => {
    const randomNumber = useNormal ? getRandomNormal() : Math.random();
    return (
      scale *
      ((randomNumber - 0.5) *
        2 *
        (particleBoundingBoxSizeOuter - particleBoundingBoxSizeInner) +
        particleBoundingBoxSizeInner)
    );
  };
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = getRandomPosition();
    particlePositions[i * 3 + 1] = getRandomPosition();
    particlePositions[i * 3 + 2] = getRandomPosition();
  }
  for (
    let i = particleCount;
    i < particleCount + particleGalacticCoreCount;
    i++
  ) {
    const radius = getRandomNormal() * 100 + 200;
    const angle = getRandomNormal() * Math.PI * 2;
    const z = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    particlePositions[i * 3] = getRandomNormal() * 400 - 200;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );
  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial()
  );
  sky.add(particles);
  sky.rotation.y = Math.PI / 8;
  scene.add(sky);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 32),
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xeeeeee,
      specular: 0xffffff,
      shininess: 1,
    })
  );
  moon.position.set(300, 300, -300);

  moonBox = new THREE.Group();
  moonBox.add(moon);
  scene.add(moonBox);
}

/**
 * Place actors
 */
function setUpObjects() {
  // test cone
  pyramid = new THREE.Mesh(
    new THREE.ConeGeometry(5, 25, 4),
    new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 0.5,
      specular: 0x6600ee,
    })
  );
  pyramid.castShadow = true;
  pyramid.position.z = -100;
  pyramid.position.y = 20;
  scene.add(pyramid);

  // add plane for the floor
  const planeGeometry = new THREE.PlaneGeometry(100, 100, 100, 100);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.5;
  scene.add(plane);
}

/**
 * Animate
 */
function animate() {
  moonBox.rotation.x = clock.getElapsedTime() * Math.PI * 0.001;
  pyramid.rotation.x = clock.getElapsedTime() * Math.PI * 0.01;
  pyramid.rotation.y = clock.getElapsedTime() * Math.PI * 0.03;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
