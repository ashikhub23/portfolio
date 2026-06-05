import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import confetti from 'canvas-confetti';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Core scrollable container reference
const scrollContainer = document.getElementById('scroll-container');

/* ==========================================================================
   Custom Fluid Cursor Setup
   ========================================================================== */
const cursorDot = document.getElementById('custom-cursor-dot');
const cursorOutline = document.getElementById('custom-cursor-outline');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Add hover effect to interactive items
const addCursorHoverListeners = () => {
  const hoverTargets = document.querySelectorAll('.hover-target, a, button, input, textarea');
  hoverTargets.forEach((target) => {
    target.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-hover');
    });
    target.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hover');
    });
  });
};

const updateCursor = () => {
  cursorX += (mouseX - cursorX) * 0.15;
  cursorY += (mouseY - cursorY) * 0.15;

  if (cursorDot) {
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  }
  if (cursorOutline) {
    cursorOutline.style.left = `${cursorX}px`;
    cursorOutline.style.top = `${cursorY}px`;
  }
};

/* ==========================================================================
   Three.js Interactive 3D Setup
   ========================================================================== */
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();

// Camera settings
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

// WebGL Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lights - AI Nexus default theme lights (Cyan & Purple)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x00e5ff, 1.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x7c4dff, 2.5, 15);
pointLight.position.set(-3, -3, 2);
scene.add(pointLight);

// Group to hold all scroll-animated 3D objects
const portfolio3DGroup = new THREE.Group();
scene.add(portfolio3DGroup);

// --- Geometries for Morphing Toggles ---
const geometries = [
  new THREE.TorusKnotGeometry(1.0, 0.35, 120, 16),
  new THREE.IcosahedronGeometry(1.2, 1),
  new THREE.SphereGeometry(1.2, 32, 32)
];
let currentGeomIndex = 0;

// Material variables - Initial AI Nexus Theme Colors (Cyan + Purple)
const materialWireframe = new THREE.MeshStandardMaterial({
  color: 0x00e5ff,
  wireframe: true,
  roughness: 0.1,
  metalness: 0.9,
  emissive: 0x004d5a,
  emissiveIntensity: 0.2
});

const materialNodes = new THREE.PointsMaterial({
  color: 0x7c4dff, // Purple nodes overlay
  size: 0.035,
  transparent: true,
  opacity: 0.8
});

const meshTorus = new THREE.Mesh(geometries[0], materialWireframe);
const pointsTorus = new THREE.Points(geometries[0], materialNodes);
portfolio3DGroup.add(meshTorus);
portfolio3DGroup.add(pointsTorus);

// --- Starfield Background ---
const particleCount = 1200;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
  starPositions[i] = (Math.random() - 0.5) * 60;
  starPositions[i + 1] = (Math.random() - 0.5) * 60;
  starPositions[i + 2] = (Math.random() - 0.5) * 40 - 20;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.05,
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending
});

const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// --- Mouse Parallax ---
let targetGroupRotationX = 0;
let targetGroupRotationY = 0;

window.addEventListener('mousemove', (e) => {
  const normX = (e.clientX / window.innerWidth) * 2 - 1;
  const normY = -(e.clientY / window.innerHeight) * 2 + 1;

  targetGroupRotationX = normY * 0.25;
  targetGroupRotationY = normX * 0.25;
});

/* ==========================================================================
   Click Interactions: Morphing Shape & Particle Burst
   ========================================================================== */
const particleBursts = [];

const getActiveThemeColor = () => {
  if (document.body.classList.contains('theme-cyber')) return 0x00f2fe;
  if (document.body.classList.contains('theme-solar')) return 0xffd700;
  if (document.body.classList.contains('theme-bio')) return 0x39ff14;
  if (document.body.classList.contains('theme-nexus')) return 0x00e5ff;
  if (document.body.classList.contains('theme-crimson')) return 0xff0033;
  return 0x00e5ff; // default nexus
};

const createParticleBurst = (x, y) => {
  const vector = new THREE.Vector3(
    (x / window.innerWidth) * 2 - 1,
    -(y / window.innerHeight) * 2 + 1,
    0.5
  );
  vector.unproject(camera);

  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));

  const burstCount = 40;
  const burstGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(burstCount * 3);
  const velocities = [];

  for (let i = 0; i < burstCount; i++) {
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;

    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.12,
      (Math.random() - 0.5) * 0.12,
      (Math.random() - 0.5) * 0.12
    ));
  }

  burstGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const burstColor = getActiveThemeColor();
  const burstMaterial = new THREE.PointsMaterial({
    color: burstColor,
    size: 0.045,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(burstGeometry, burstMaterial);
  scene.add(points);

  particleBursts.push({
    points: points,
    velocities: velocities,
    age: 0,
    maxAge: 50
  });
};

window.addEventListener('click', (e) => {
  if (e.target.closest('.theme-switcher, a, button, input, textarea, label')) return;

  createParticleBurst(e.clientX, e.clientY);

  currentGeomIndex = (currentGeomIndex + 1) % geometries.length;
  meshTorus.geometry = geometries[currentGeomIndex];
  pointsTorus.geometry = geometries[currentGeomIndex];

  gsap.fromTo(portfolio3DGroup.scale, 
    { x: 0.6, y: 0.6, z: 0.6 },
    { 
      x: isMobile() ? 0.7 : getTargetScaleForActivePanel(), 
      y: isMobile() ? 0.7 : getTargetScaleForActivePanel(), 
      z: isMobile() ? 0.7 : getTargetScaleForActivePanel(), 
      duration: 0.5, 
      ease: "back.out(2)" 
    }
  );
});

const getTargetScaleForActivePanel = () => {
  if (!scrollContainer) return 1.0;
  const progress = scrollContainer.scrollTop / window.innerHeight;
  if (progress > 2.5 && progress < 3.5) return 0.8;
  return 1.0;
};

/* ==========================================================================
   GSAP ScrollTrigger Camera Path (6-page transition mapping)
   ========================================================================== */
const isMobile = () => window.innerWidth < 1024;

let scrollTimeline;

const setupScrollAnimations = () => {
  if (scrollTimeline) scrollTimeline.kill();

  portfolio3DGroup.position.set(0, 0, 0);
  portfolio3DGroup.scale.set(1.0, 1.0, 1.0);
  
  if (!isMobile()) {
    portfolio3DGroup.position.x = 1.6;
  } else {
    portfolio3DGroup.position.y = -0.5;
    portfolio3DGroup.scale.set(0.7, 0.7, 0.7);
  }

  scrollTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scroller: '#scroll-container',
      scrub: 1.2,
      onUpdate: (self) => {
        const progressBar = document.getElementById('scroll-progress-bar');
        if (progressBar) {
          progressBar.style.width = `${self.progress * 100}%`;
        }
      }
    }
  });

  // State 1 (Home -> About) [0 to 1]
  scrollTimeline.to(portfolio3DGroup.position, {
    x: isMobile() ? 0 : -1.8,
    y: isMobile() ? -0.8 : 0,
    z: 0.4,
    duration: 1
  }, 0)

  // State 2 (About -> Experience) [1 to 2]
  .to(portfolio3DGroup.position, {
    x: isMobile() ? 0 : 1.8,
    y: isMobile() ? 0.7 : -0.2,
    z: -0.5,
    duration: 1
  }, 1)
  .to(meshTorus.rotation, {
    x: Math.PI * 0.8,
    y: Math.PI * 0.4,
    duration: 1
  }, 1)

  // State 3 (Experience -> Skills) [2 to 3]
  .to(portfolio3DGroup.position, {
    x: isMobile() ? 0 : -1.8,
    y: isMobile() ? -0.8 : 0,
    z: 0.5,
    duration: 1
  }, 2)
  .to(portfolio3DGroup.scale, {
    x: isMobile() ? 0.6 : 0.85,
    y: isMobile() ? 0.6 : 0.85,
    z: isMobile() ? 0.6 : 0.85,
    duration: 1
  }, 2)

  // State 4 (Skills -> Projects) [3 to 4]
  .to(portfolio3DGroup.position, {
    x: 0,
    y: isMobile() ? 0.8 : 1.3,
    z: -1.2,
    duration: 1
  }, 3)
  .to(portfolio3DGroup.scale, {
    x: isMobile() ? 0.5 : 0.75,
    y: isMobile() ? 0.5 : 0.75,
    z: isMobile() ? 0.5 : 0.75,
    duration: 1
  }, 3)

  // State 5 (Projects -> Contact) [4 to 5]
  .to(portfolio3DGroup.position, {
    x: isMobile() ? 0 : 2,
    y: isMobile() ? -0.8 : -0.5,
    z: 0.8,
    duration: 1
  }, 4)
  .to(portfolio3DGroup.scale, {
    x: isMobile() ? 0.75 : 1.0,
    y: isMobile() ? 0.75 : 1.0,
    z: isMobile() ? 0.75 : 1.0,
    duration: 1
  }, 4);
};

setupScrollAnimations();

/* ==========================================================================
   Interactive Theme Customizer Logic
   ========================================================================== */
const themeBtns = document.querySelectorAll('.theme-btn');

const themeColors = {
  crimson: {
    wire: 0xff0033,
    nodes: 0xff4500,
    dir: 0xff0033,
    point: 0x8b0000
  },
  cyber: {
    wire: 0x00f2fe,
    nodes: 0xff137d,
    dir: 0x00f2fe,
    point: 0xff137d
  },
  solar: {
    wire: 0xffd700,
    nodes: 0xff007f,
    dir: 0xff8c00,
    point: 0xff007f
  },
  bio: {
    wire: 0x39ff14,
    nodes: 0x00e5ff,
    dir: 0x00e5ff,
    point: 0x39ff14
  },
  nexus: {
    wire: 0x00e5ff,
    nodes: 0x7c4dff,
    dir: 0x00e5ff,
    point: 0x7c4dff
  }
};

const handleThemeChange = (themeName) => {
  // Update HTML body theme classes
  document.body.classList.remove('theme-crimson', 'theme-cyber', 'theme-solar', 'theme-bio', 'theme-nexus');
  document.body.classList.add(`theme-${themeName}`);

  // Update active button indicator states
  themeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-theme') === themeName) {
      btn.classList.add('active');
    }
  });

  // Interpolate Three.js lighting & meshes to match target theme variables
  const targets = themeColors[themeName];
  const duration = 0.8;

  gsap.to(materialWireframe.color, {
    r: ((targets.wire >> 16) & 255) / 255,
    g: ((targets.wire >> 8) & 255) / 255,
    b: (targets.wire & 255) / 255,
    duration: duration
  });
  
  gsap.to(materialNodes.color, {
    r: ((targets.nodes >> 16) & 255) / 255,
    g: ((targets.nodes >> 8) & 255) / 255,
    b: (targets.nodes & 255) / 255,
    duration: duration
  });

  gsap.to(directionalLight.color, {
    r: ((targets.dir >> 16) & 255) / 255,
    g: ((targets.dir >> 8) & 255) / 255,
    b: (targets.dir & 255) / 255,
    duration: duration
  });

  gsap.to(pointLight.color, {
    r: ((targets.point >> 16) & 255) / 255,
    g: ((targets.point >> 8) & 255) / 255,
    b: (targets.point & 255) / 255,
    duration: duration
  });
};

themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const selectedTheme = btn.getAttribute('data-theme');
    handleThemeChange(selectedTheme);
  });
});

/* ==========================================================================
   Navigation Anchors & Active Highlighting
   ========================================================================== */
const sections = document.querySelectorAll('section.panel');
const navLinks = document.querySelectorAll('.nav-link');

const updateActiveNavLink = () => {
  if (!scrollContainer) return;
  
  let currentSectionId = '';
  const containerScrollTop = scrollContainer.scrollTop;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (containerScrollTop >= sectionTop - sectionHeight * 0.4) {
      currentSectionId = section.getAttribute('id');
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSectionId}`) {
      link.classList.add('active');
    }
  });
};

if (scrollContainer) {
  scrollContainer.addEventListener('scroll', updateActiveNavLink);
}

// Smooth scrolling override for custom container
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    if (targetSection && scrollContainer) {
      scrollContainer.scrollTo({
        top: targetSection.offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

/* ==========================================================================
   EmailJS Configuration
   Replace these with your actual EmailJS credentials from emailjs.com
   ========================================================================== */
const EMAILJS_PUBLIC_KEY = 'yn2j1gPbT0LVxajpE';   // e.g. 'AbCdEfGhIjKlMn'
const EMAILJS_SERVICE_ID = 'service_nexw7b2';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template_xqsxcbh'; // e.g. 'template_xyz789'

// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

/* ==========================================================================
   Form Handling & EmailJS Sending + Confetti Effect
   ========================================================================== */
const contactForm = document.getElementById('portfolio-contact-form');
const submitBtn = document.getElementById('form-submit-btn');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSpan = submitBtn.querySelector('span');
    const originalText = btnSpan.innerText;
    btnSpan.innerText = 'Transmitting...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    // Collect form data
    const formName = document.getElementById('form-name').value;
    const formEmail = document.getElementById('form-email').value;
    const formMessage = document.getElementById('form-message').value;

    // EmailJS template params — must match your EmailJS template variables
    const templateParams = {
      from_name: formName,
      from_email: formEmail,
      message: formMessage,
      to_email: 'mohamedashik2306@gmail.com'
    };

    try {
      // Send email via EmailJS
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

      // Success! Confetti celebration
      const activeColor = getActiveThemeColor();
      let confettiColor = '#00e5ff';
      let confettiSecondary = '#7C4DFF';
      if (activeColor === 0x00f2fe) { confettiColor = '#00f2fe'; confettiSecondary = '#ff137d'; }
      if (activeColor === 0xffd700) { confettiColor = '#ffd700'; confettiSecondary = '#ff007f'; }
      if (activeColor === 0x39ff14) { confettiColor = '#39ff14'; confettiSecondary = '#00e5ff'; }
      if (activeColor === 0xff0033) { confettiColor = '#ff0033'; confettiSecondary = '#a066ff'; }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: [confettiColor, confettiSecondary, '#448AFF', '#ffffff']
      });

      contactForm.reset();
      btnSpan.innerText = 'Message Sent!';
    } catch (error) {
      console.error('EmailJS Error:', error);
      btnSpan.innerText = 'Failed to Send';
    }

    // Reset button after 3 seconds
    setTimeout(() => {
      btnSpan.innerText = originalText;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }, 3000);
  });
}

/* ==========================================================================
   Window Resize & Screen Management
   ========================================================================== */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  ScrollTrigger.refresh();
  setupScrollAnimations();
});

/* ==========================================================================
   Core Animation Loop
   ========================================================================== */
const clock = new THREE.Clock();

const animate = () => {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // 1. Rotate the central meshes
  meshTorus.rotation.x = elapsedTime * 0.25;
  meshTorus.rotation.y = elapsedTime * 0.15;
  pointsTorus.rotation.x = elapsedTime * 0.25;
  pointsTorus.rotation.y = elapsedTime * 0.15;

  // 2. Starfield drift rotation
  starField.rotation.y = elapsedTime * 0.015;
  starField.rotation.x = elapsedTime * 0.008;

  // 3. Mouse Parallax interpolation
  portfolio3DGroup.rotation.x += (targetGroupRotationX - portfolio3DGroup.rotation.x) * 0.08;
  portfolio3DGroup.rotation.y += (targetGroupRotationY - portfolio3DGroup.rotation.y) * 0.08;

  // 4. Click Particle Burst Updates
  for (let i = particleBursts.length - 1; i >= 0; i--) {
    const burst = particleBursts[i];
    const posAttr = burst.points.geometry.attributes.position;
    const positions = posAttr.array;

    for (let j = 0; j < posAttr.count; j++) {
      const velocity = burst.velocities[j];
      positions[j * 3] += velocity.x;
      positions[j * 3 + 1] += velocity.y;
      positions[j * 3 + 2] += velocity.z;
    }

    posAttr.needsUpdate = true;
    burst.points.material.opacity = 1.0 - (burst.age / burst.maxAge);
    burst.age++;

    if (burst.age >= burst.maxAge) {
      scene.remove(burst.points);
      burst.points.geometry.dispose();
      burst.points.material.dispose();
      particleBursts.splice(i, 1);
    }
  }

  // 5. Update custom cursor physics
  updateCursor();

  // 6. Render Scene
  renderer.render(scene, camera);
};

// Initialize interactive triggers
addCursorHoverListeners();

/* ==========================================================================
   Mobile Hamburger Menu Toggle
   ========================================================================== */
const hamburgerBtn = document.querySelector('.hamburger-btn');
const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

const toggleMobileNav = () => {
  const isOpen = hamburgerBtn.classList.toggle('open');
  mobileNavOverlay.classList.toggle('open');
  hamburgerBtn.setAttribute('aria-expanded', isOpen);

  // Prevent body scroll when menu is open
  if (isOpen) {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
};

const closeMobileNav = () => {
  hamburgerBtn.classList.remove('open');
  mobileNavOverlay.classList.remove('open');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
};

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileNav();
  });
}

// Close mobile nav when a link is clicked
mobileNavLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetSection = document.querySelector(targetId);

    closeMobileNav();

    // Scroll to section after small delay for animation
    setTimeout(() => {
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  });
});

// Close mobile nav on overlay background click
if (mobileNavOverlay) {
  mobileNavOverlay.addEventListener('click', (e) => {
    if (e.target === mobileNavOverlay) {
      closeMobileNav();
    }
  });
}

// Close mobile nav on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileNavOverlay && mobileNavOverlay.classList.contains('open')) {
    closeMobileNav();
  }
});

// Close mobile nav if window resizes to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && mobileNavOverlay && mobileNavOverlay.classList.contains('open')) {
    closeMobileNav();
  }
});

// Start animation loop
animate();
